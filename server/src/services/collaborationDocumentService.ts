import * as Y from 'yjs';
import {
  applyAwarenessUpdate,
  Awareness,
  encodeAwarenessUpdate,
  removeAwarenessStates
} from 'y-protocols/awareness';

interface AwarenessChange {
  readonly added: readonly number[];
  readonly updated: readonly number[];
  readonly removed: readonly number[];
}

interface CollaborationRoom {
  readonly roomId: string;
  readonly socketRoomName: string;
  readonly document: Y.Doc;
  readonly awareness: Awareness;
  readonly socketAwarenessClients: Map<string, Set<number>>;
}

export class CollaborationDocumentService {
  private readonly rooms = new Map<string, CollaborationRoom>();

  constructor(private readonly defaultRoomName: string) {}

  createRoom(): CollaborationRoom {
    const roomId = this.generateRoomId();
    const room = this.createRoomState(roomId);
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): CollaborationRoom | undefined {
    return this.rooms.get(roomId);
  }

  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  getRoomName(roomId: string): string {
    return this.requireRoom(roomId).socketRoomName;
  }

  getDocument(roomId: string): Y.Doc {
    return this.requireRoom(roomId).document;
  }

  encodeDocumentState(roomId: string): Uint8Array {
    return Y.encodeStateAsUpdate(this.requireRoom(roomId).document);
  }

  applyDocumentUpdate(roomId: string, update: Uint8Array, origin: unknown): void {
    Y.applyUpdate(this.requireRoom(roomId).document, update, origin);
  }

  encodeAwarenessState(roomId: string): Uint8Array {
    const awareness = this.requireRoom(roomId).awareness;
    return encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys()));
  }

  applyAwarenessUpdate(roomId: string, socketId: string, update: Uint8Array): void {
    const room = this.requireRoom(roomId);
    let changedClientIds: readonly number[] = [];
    const updateListener = (change: AwarenessChange, origin: unknown): void => {
      if (origin === socketId) {
        changedClientIds = [...change.added, ...change.updated, ...change.removed];
      }
    };

    room.awareness.on('update', updateListener);

    try {
      applyAwarenessUpdate(room.awareness, update, socketId);
    } finally {
      room.awareness.off('update', updateListener);
    }

    if (changedClientIds.length === 0) {
      return;
    }

    const trackedClients = room.socketAwarenessClients.get(socketId) ?? new Set<number>();

    for (const clientId of changedClientIds) {
      if (room.awareness.getStates().has(clientId)) {
        trackedClients.add(clientId);
      } else {
        trackedClients.delete(clientId);
      }
    }

    if (trackedClients.size === 0) {
      room.socketAwarenessClients.delete(socketId);
      return;
    }

    room.socketAwarenessClients.set(socketId, trackedClients);
  }

  removeAwarenessForSocket(roomId: string, socketId: string): Uint8Array | null {
    const room = this.requireRoom(roomId);
    const trackedClients = room.socketAwarenessClients.get(socketId);

    if (trackedClients === undefined || trackedClients.size === 0) {
      return null;
    }

    const clientIds = Array.from(trackedClients);
    removeAwarenessStates(room.awareness, clientIds, socketId);
    room.socketAwarenessClients.delete(socketId);

    return encodeAwarenessUpdate(room.awareness, clientIds);
  }

  destroy(): void {
    for (const room of this.rooms.values()) {
      room.awareness.destroy();
      room.document.destroy();
    }

    this.rooms.clear();
  }

  private createRoomState(roomId: string): CollaborationRoom {
    const document = new Y.Doc();
    return {
      roomId,
      socketRoomName: `${this.defaultRoomName}:${roomId}`,
      document,
      awareness: new Awareness(document),
      socketAwarenessClients: new Map<string, Set<number>>()
    };
  }

  private generateRoomId(): string {
    for (let attempts = 0; attempts < 9000; attempts += 1) {
      const roomId = String(Math.floor(1000 + Math.random() * 9000));

      if (!this.rooms.has(roomId)) {
        return roomId;
      }
    }

    throw new Error('Unable to allocate a room ID.');
  }

  private requireRoom(roomId: string): CollaborationRoom {
    const room = this.rooms.get(roomId);

    if (room === undefined) {
      throw new Error(`Room ${roomId} was not found.`);
    }

    return room;
  }
}
