import type { Awareness } from 'y-protocols/awareness';
import type * as Y from 'yjs';

export interface CollaborationProvider {
  readonly awareness: Awareness;
}

export interface CollaborationUser {
  readonly name: string;
  readonly color: string;
}

export interface CollaborationState {
  readonly document: Y.Doc;
  readonly awareness: Awareness;
  readonly provider: CollaborationProvider;
}
