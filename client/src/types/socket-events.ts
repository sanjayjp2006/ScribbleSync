import type { Socket } from 'socket.io-client';

import type { DrawingStrokePayload } from '@/types/drawing';

import type { User } from './user';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ClientToServerEvents {
  readonly 'room:create': (
    payload: { readonly name: string },
    callback: (
      response:
        | { readonly ok: true; readonly roomId: string }
        | { readonly ok: false; readonly message: string }
    ) => void
  ) => void;
  readonly 'room:join': (
    payload: { readonly name: string; readonly roomId: string },
    callback: (
      response:
        | { readonly ok: true; readonly roomId: string }
        | { readonly ok: false; readonly message: string }
    ) => void
  ) => void;
  readonly join: (payload: { readonly name: string; readonly roomId: string }) => void;
  readonly leave: () => void;
  readonly 'yjs:update': (payload: { readonly update: Uint8Array }) => void;
  readonly 'yjs:awareness': (payload: { readonly update: Uint8Array }) => void;
  readonly presence: (payload: { readonly status: 'active' | 'idle' | 'away' }) => void;
  readonly cursor: (payload: { readonly anchor: number; readonly head: number }) => void;
  readonly selection: (payload: { readonly from: number; readonly to: number }) => void;
  readonly typing: () => void;
  readonly stopTyping: () => void;
  readonly 'drawing:stroke': (payload: DrawingStrokePayload) => void;
  readonly 'drawing:clear': () => void;
}

export interface ServerToClientEvents {
  readonly 'client:connected': (payload: { readonly socketId: string }) => void;
  readonly 'user:joined': (payload: { readonly user: User }) => void;
  readonly 'user:left': (payload: { readonly user: User }) => void;
  readonly 'users:online': (payload: { readonly users: readonly User[] }) => void;
  readonly 'yjs:sync': (payload: { readonly update: Uint8Array }) => void;
  readonly 'yjs:update': (payload: { readonly update: Uint8Array }) => void;
  readonly 'yjs:awareness': (payload: { readonly update: Uint8Array }) => void;
  readonly presence: (payload: {
    readonly socketId: string;
    readonly presence: { readonly status: 'active' | 'idle' | 'away' };
  }) => void;
  readonly cursor: (payload: {
    readonly socketId: string;
    readonly cursor: { readonly anchor: number; readonly head: number };
  }) => void;
  readonly selection: (payload: {
    readonly socketId: string;
    readonly selection: { readonly from: number; readonly to: number };
  }) => void;
  readonly typing: (payload: { readonly socketId: string }) => void;
  readonly stopTyping: (payload: { readonly socketId: string }) => void;
  readonly 'drawing:stroke': (payload: DrawingStrokePayload) => void;
  readonly 'drawing:clear': () => void;
  readonly 'room:created': (payload: { readonly roomId: string }) => void;
  readonly 'room:not-found': () => void;
  readonly error: (payload: { readonly message: string }) => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
