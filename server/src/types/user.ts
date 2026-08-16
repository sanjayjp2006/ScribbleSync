export type ConnectionStatus = 'online';

export interface User {
  readonly socketId: string;
  readonly roomId: string;
  readonly name: string;
  readonly color: string;
  readonly joinedAt: string;
  readonly status: ConnectionStatus;
}

export interface JoinPayload {
  readonly name: string;
  readonly roomId: string;
}

export interface PresencePayload {
  readonly status: 'active' | 'idle' | 'away';
}

export interface CursorPayload {
  readonly anchor: number;
  readonly head: number;
}

export interface SelectionPayload {
  readonly from: number;
  readonly to: number;
}

export interface TypingPayload {
  readonly isTyping: boolean;
}
