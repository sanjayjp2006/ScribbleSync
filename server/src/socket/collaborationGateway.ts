import type { Server, Socket } from 'socket.io';
import { ZodError } from 'zod';

import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from '../types/socket-events.js';
import type { User } from '../types/user.js';
import {
  createRoomPayloadSchema,
  cursorPayloadSchema,
  joinPayloadSchema,
  presencePayloadSchema,
  selectionPayloadSchema,
  validatePayload
} from '../utils/validation.js';
import type { CollaborationDocumentService } from '../services/collaborationDocumentService.js';
import type { UserRegistry } from '../services/userRegistry.js';
import { logger } from '../utils/logger.js';

type CollaborationServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type CollaborationSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export class CollaborationGateway {
  constructor(
    private readonly io: CollaborationServer,
    private readonly users: UserRegistry,
    private readonly documentService: CollaborationDocumentService
  ) {}

  register(): void {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: CollaborationSocket): void {
    socket.emit('client:connected', { socketId: socket.id });
    logger.info('Client connected', { socketId: socket.id });

    socket.on('room:create', (payload, callback) => {
      this.safeHandle(socket, () => {
        const parsedPayload = validatePayload(createRoomPayloadSchema, payload);
        const room = this.documentService.createRoom();
        const user = this.joinRoom(socket, room.roomId, parsedPayload.name);
        callback({ ok: true, roomId: room.roomId });
        this.broadcastUserJoined(socket, user);
        socket.emit('room:created', { roomId: room.roomId });
      });
    });

    socket.on('room:join', (payload, callback) => {
      this.safeHandle(socket, () => {
        const parsedPayload = validatePayload(joinPayloadSchema, payload);

        if (!this.documentService.hasRoom(parsedPayload.roomId)) {
          socket.emit('room:not-found');
          callback({ ok: false, message: 'Room not found.' });
          return;
        }

        const user = this.joinRoom(socket, parsedPayload.roomId, parsedPayload.name);
        callback({ ok: true, roomId: parsedPayload.roomId });
        this.broadcastUserJoined(socket, user);
      });
    });

    socket.on('join', (payload) => {
      this.safeHandle(socket, () => {
        const parsedPayload = validatePayload(joinPayloadSchema, payload);
        const user = this.joinRoom(socket, parsedPayload.roomId, parsedPayload.name);
        this.broadcastUserJoined(socket, user);
      });
    });

    socket.on('leave', () => {
      this.safeHandle(socket, () => {
        this.removeUser(socket, 'Client left');
      });
    });

    socket.on('yjs:update', (payload) => {
      this.safeHandle(socket, () => {
        const roomId = this.getSocketRoomId(socket);
        const roomName = this.documentService.getRoomName(roomId);
        const update = this.toUint8Array(payload.update);
        this.documentService.applyDocumentUpdate(roomId, update, socket.id);
        socket.to(roomName).emit('yjs:update', { update });
      });
    });

    socket.on('yjs:awareness', (payload) => {
      this.safeHandle(socket, () => {
        const roomId = this.getSocketRoomId(socket);
        const roomName = this.documentService.getRoomName(roomId);
        const update = this.toUint8Array(payload.update);
        this.documentService.applyAwarenessUpdate(roomId, socket.id, update);
        socket.to(roomName).emit('yjs:awareness', { update });
      });
    });

    socket.on('drawing:stroke', (payload) => {
      this.safeHandle(socket, () => {
        const roomName = this.getSocketRoomName(socket);
        socket.to(roomName).emit('drawing:stroke', payload);
      });
    });

    socket.on('drawing:clear', () => {
      this.safeHandle(socket, () => {
        const roomName = this.getSocketRoomName(socket);
        socket.to(roomName).emit('drawing:clear');
      });
    });
    socket.on('presence', (payload) => {
      this.safeHandle(socket, () => {
        const roomName = this.getSocketRoomName(socket);
        const presence = validatePayload(presencePayloadSchema, payload);
        socket.to(roomName).emit('presence', { socketId: socket.id, presence });
      });
    });

    socket.on('cursor', (payload) => {
      this.safeHandle(socket, () => {
        const roomName = this.getSocketRoomName(socket);
        const cursor = validatePayload(cursorPayloadSchema, payload);
        socket.to(roomName).emit('cursor', { socketId: socket.id, cursor });
      });
    });

    socket.on('selection', (payload) => {
      this.safeHandle(socket, () => {
        const roomName = this.getSocketRoomName(socket);
        const selection = validatePayload(selectionPayloadSchema, payload);
        socket.to(roomName).emit('selection', { socketId: socket.id, selection });
      });
    });

    socket.on('typing', () => {
      this.safeHandle(socket, () => {
        const roomName = this.getSocketRoomName(socket);
        socket.to(roomName).emit('typing', { socketId: socket.id });
      });
    });

    socket.on('stopTyping', () => {
      this.safeHandle(socket, () => {
        const roomName = this.getSocketRoomName(socket);
        socket.to(roomName).emit('stopTyping', { socketId: socket.id });
      });
    });

    socket.on('disconnect', (reason) => {
      this.safeHandle(socket, () => {
        this.removeUser(socket, 'Client disconnected', { reason });
      });
    });
  }

  private broadcastUserJoined(socket: CollaborationSocket, user: User): void {
    const roomName = this.documentService.getRoomName(user.roomId);
    this.io.to(roomName).emit('user:joined', { user });
    this.io.to(roomName).emit('users:online', { users: this.users.list(user.roomId) });
    logger.info('User joined', { socketId: socket.id, name: user.name, roomId: user.roomId });
  }

  private removeUser(
    socket: CollaborationSocket,
    logMessage: string,
    metadata: Readonly<Record<string, unknown>> = {}
  ): void {
    const user = this.users.remove(socket.id);

    if (user === undefined) {
      return;
    }

    const roomName = this.documentService.getRoomName(user.roomId);
    const awarenessUpdate = this.documentService.removeAwarenessForSocket(user.roomId, socket.id);

    if (awarenessUpdate !== null) {
      socket.to(roomName).emit('yjs:awareness', { update: awarenessUpdate });
    }

    this.io.to(roomName).emit('user:left', { user });
    this.io.to(roomName).emit('users:online', { users: this.users.list(user.roomId) });
    void socket.leave(roomName);
    delete socket.data.roomName;
    logger.info(logMessage, {
      socketId: socket.id,
      name: user.name,
      roomId: user.roomId,
      ...metadata
    });
  }

  private joinRoom(socket: CollaborationSocket, roomId: string, name: string): User {
    const existingUser = this.users.get(socket.id);

    if (existingUser !== undefined && existingUser.roomId !== roomId) {
      this.removeUser(socket, 'Client switched rooms');
    }

    const roomName = this.documentService.getRoomName(roomId);
    socket.data.roomName = roomName;
    void socket.join(roomName);
    const user = this.users.upsert(socket.id, roomId, name);
    socket.emit('yjs:sync', { update: this.documentService.encodeDocumentState(roomId) });
    socket.emit('yjs:awareness', { update: this.documentService.encodeAwarenessState(roomId) });
    socket.emit('users:online', { users: this.users.list(roomId) });
    return user;
  }

  private getSocketRoomId(socket: CollaborationSocket): string {
    const user = this.users.get(socket.id);

    if (user === undefined) {
      throw new Error('Socket has not joined a room.');
    }

    return user.roomId;
  }

  private getSocketRoomName(socket: CollaborationSocket): string {
    const roomName = socket.data.roomName;

    if (roomName === undefined) {
      throw new Error('Socket has not joined a room.');
    }

    return roomName;
  }

  private safeHandle(socket: CollaborationSocket, handler: () => void): void {
    try {
      handler();
    } catch (error) {
      if (error instanceof ZodError) {
        socket.emit('error', { message: 'Invalid socket payload' });
        logger.warn('Invalid socket payload', { socketId: socket.id, issues: error.issues });
        return;
      }

      socket.emit('error', { message: 'Unexpected socket error' });
      logger.error('Unhandled socket error', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private toUint8Array(value: unknown): Uint8Array {
    if (value instanceof Uint8Array) {
      return value;
    }

    if (value instanceof ArrayBuffer) {
      return new Uint8Array(value);
    }

    if (ArrayBuffer.isView(value)) {
      return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }

    if (Array.isArray(value) && value.every((item) => typeof item === 'number')) {
      return Uint8Array.from(value);
    }

    throw new Error('Invalid binary payload');
  }
}
