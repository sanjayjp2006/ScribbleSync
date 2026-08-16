import type {
  JoinPayload,
  CursorPayload,
  PresencePayload,
  SelectionPayload,
  User
} from './user.js';

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
    readonly presence: PresencePayload;
  }) => void;
  readonly cursor: (payload: { readonly socketId: string; readonly cursor: CursorPayload }) => void;
  readonly selection: (payload: {
    readonly socketId: string;
    readonly selection: SelectionPayload;
  }) => void;
  readonly typing: (payload: { readonly socketId: string }) => void;
  readonly stopTyping: (payload: { readonly socketId: string }) => void;
  readonly 'drawing:stroke': (payload: DrawingStrokePayload) => void;
  readonly 'drawing:clear': () => void;
  readonly 'room:created': (payload: { readonly roomId: string }) => void;
  readonly 'room:not-found': () => void;
  readonly error: (payload: { readonly message: string }) => void;
}

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
    payload: JoinPayload,
    callback: (
      response:
        | { readonly ok: true; readonly roomId: string }
        | { readonly ok: false; readonly message: string }
    ) => void
  ) => void;
  readonly join: (payload: JoinPayload) => void;
  readonly leave: () => void;
  readonly 'yjs:update': (payload: { readonly update: Uint8Array }) => void;
  readonly 'yjs:awareness': (payload: { readonly update: Uint8Array }) => void;
  readonly presence: (payload: PresencePayload) => void;
  readonly cursor: (payload: CursorPayload) => void;
  readonly selection: (payload: SelectionPayload) => void;
  readonly typing: () => void;
  readonly stopTyping: () => void;
  readonly 'drawing:stroke': (payload: DrawingStrokePayload) => void;
  readonly 'drawing:clear': () => void;
}

export interface InterServerEvents {
  readonly ping: () => void;
}

export interface SocketData {
  roomName?: string;
}

export interface DrawingPoint {
  readonly x: number;
  readonly y: number;
}

export interface DrawingStrokePayload {
  readonly id: string;
  readonly tool: 'brush' | 'eraser';
  readonly color: string;
  readonly size: number;
  readonly points: readonly DrawingPoint[];
}
