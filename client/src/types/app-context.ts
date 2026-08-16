import type { Editor } from '@tiptap/react';
import type { Dispatch, SetStateAction } from 'react';

import type { CollaborationState } from '@/types/collaboration';
import type { AppSocket, ConnectionStatus } from '@/types/socket-events';
import type { User } from '@/types/user';

export interface AppContextValue {
  readonly username: string;
  readonly setUsername: (username: string) => void;
  readonly roomId: string;
  readonly setRoomId: (roomId: string) => void;
  readonly connectionStatus: ConnectionStatus;
  readonly setConnectionStatus: (status: ConnectionStatus) => void;
  readonly socket: AppSocket;
  readonly onlineUsers: readonly User[];
  readonly setOnlineUsers: Dispatch<SetStateAction<readonly User[]>>;
  readonly currentUser: User | null;
  readonly setCurrentUser: Dispatch<SetStateAction<User | null>>;
  readonly editor: Editor | null;
  readonly setEditor: (editor: Editor | null) => void;
  readonly collaboration: CollaborationState;
}
