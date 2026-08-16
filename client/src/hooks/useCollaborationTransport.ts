import { useEffect } from 'react';
import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates
} from 'y-protocols/awareness';
import * as Y from 'yjs';

import { useAppContext } from '@/hooks/useAppContext';
import { socketService } from '@/services/socketService';
import type { User } from '@/types/user';

const SOCKET_ORIGIN = 'socket.io-yjs-transport';
const FALLBACK_CURSOR_COLOR = '#2563eb';

const toUint8Array = (value: unknown): Uint8Array => {
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

  throw new Error('Invalid binary update.');
};

export const useCollaborationTransport = (): void => {
  const {
    socket,
    username,
    roomId,
    collaboration,
    setConnectionStatus,
    setOnlineUsers,
    setCurrentUser
  } = useAppContext();

  useEffect(() => {
    const { document, awareness } = collaboration;

    const syncUserAwareness = (user: User | null): void => {
      awareness.setLocalStateField('user', {
        name: username,
        color: user?.color ?? FALLBACK_CURSOR_COLOR
      });
    };

    const handleConnect = (): void => {
      setConnectionStatus('connected');
      socket.emit('join', { name: username, roomId });
      syncUserAwareness(null);
    };

    const handleDisconnect = (): void => {
      setConnectionStatus('disconnected');
      setOnlineUsers([]);
      setCurrentUser(null);
    };

    const handleConnectError = (): void => {
      setConnectionStatus('error');
    };

    const handleUsersOnline = (payload: { readonly users: readonly User[] }): void => {
      setOnlineUsers(payload.users);
      setCurrentUser(payload.users.find((user) => user.socketId === socket.id) ?? null);
    };

    const handleUserJoined = (payload: { readonly user: User }): void => {
      setOnlineUsers((previousUsers) => {
        const nextUsers = previousUsers.filter((user) => user.socketId !== payload.user.socketId);
        return [...nextUsers, payload.user];
      });

      if (payload.user.socketId === socket.id) {
        setCurrentUser(payload.user);
        syncUserAwareness(payload.user);
      }
    };

    const handleUserLeft = (payload: { readonly user: User }): void => {
      setOnlineUsers((previousUsers) =>
        previousUsers.filter((user) => user.socketId !== payload.user.socketId)
      );
    };

    const handleYjsSync = (payload: { readonly update: Uint8Array }): void => {
      Y.applyUpdate(document, toUint8Array(payload.update), SOCKET_ORIGIN);
    };

    const handleYjsUpdate = (payload: { readonly update: Uint8Array }): void => {
      Y.applyUpdate(document, toUint8Array(payload.update), SOCKET_ORIGIN);
    };

    const handleAwarenessUpdate = (payload: { readonly update: Uint8Array }): void => {
      applyAwarenessUpdate(awareness, toUint8Array(payload.update), SOCKET_ORIGIN);
    };

    const handleLocalDocumentUpdate = (update: Uint8Array, origin: unknown): void => {
      if (origin === SOCKET_ORIGIN || !socket.connected) {
        return;
      }

      socket.emit('yjs:update', { update });
    };

    const handleLocalAwarenessUpdate = (
      change: {
        readonly added: readonly number[];
        readonly updated: readonly number[];
        readonly removed: readonly number[];
      },
      origin: unknown
    ): void => {
      if (origin === SOCKET_ORIGIN || !socket.connected) {
        return;
      }

      const changedClients = [...change.added, ...change.updated, ...change.removed];

      if (changedClients.length === 0) {
        return;
      }

      socket.emit('yjs:awareness', {
        update: encodeAwarenessUpdate(awareness, changedClients)
      });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('users:online', handleUsersOnline);
    socket.on('user:joined', handleUserJoined);
    socket.on('user:left', handleUserLeft);
    socket.on('yjs:sync', handleYjsSync);
    socket.on('yjs:update', handleYjsUpdate);
    socket.on('yjs:awareness', handleAwarenessUpdate);
    document.on('update', handleLocalDocumentUpdate);
    awareness.on('update', handleLocalAwarenessUpdate);

    if (socket.connected) {
      handleConnect();
    } else {
      setConnectionStatus('connecting');
      socketService.connect(socket);
    }

    return () => {
      const localClientId = awareness.clientID;
      removeAwarenessStates(awareness, [localClientId], 'editor-unmount');
      socket.emit('leave');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('users:online', handleUsersOnline);
      socket.off('user:joined', handleUserJoined);
      socket.off('user:left', handleUserLeft);
      socket.off('yjs:sync', handleYjsSync);
      socket.off('yjs:update', handleYjsUpdate);
      socket.off('yjs:awareness', handleAwarenessUpdate);
      document.off('update', handleLocalDocumentUpdate);
      awareness.off('update', handleLocalAwarenessUpdate);
      socketService.disconnect(socket);
      setConnectionStatus('disconnected');
      setOnlineUsers([]);
      setCurrentUser(null);
    };
  }, [
    collaboration,
    roomId,
    setConnectionStatus,
    setCurrentUser,
    setOnlineUsers,
    socket,
    username
  ]);
};
