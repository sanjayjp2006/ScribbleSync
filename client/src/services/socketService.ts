import { io } from 'socket.io-client';

import type { AppSocket } from '@/types/socket-events';

const getServerUrl = (): string => {
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  if (typeof serverUrl === 'string' && serverUrl.length > 0) {
    return serverUrl;
  }

  return window.location.origin;
};

const getSocketNamespace = (): string => import.meta.env.VITE_SOCKET_NAMESPACE || '/';

export interface SocketService {
  readonly createSocket: () => AppSocket;
  readonly connect: (socket: AppSocket) => void;
  readonly disconnect: (socket: AppSocket) => void;
}

const createSocket = (): AppSocket =>
  io(`${getServerUrl()}${getSocketNamespace()}`, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    transports: ['websocket', 'polling'],
    path: '/socket.io'
  });

export const socketService: SocketService = {
  createSocket,
  connect: (socket) => {
    if (!socket.connected) {
      socket.connect();
    }
  },
  disconnect: (socket) => {
    if (socket.connected) {
      socket.disconnect();
    }
  }
};
