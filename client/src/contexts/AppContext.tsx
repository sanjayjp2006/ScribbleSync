import type { Editor } from '@tiptap/react';
import { useMemo, useState, type PropsWithChildren, type ReactElement } from 'react';
import { Awareness } from 'y-protocols/awareness';
import * as Y from 'yjs';

import { socketService } from '@/services/socketService';
import { AppContext } from '@/contexts/appContextValue';
import type { CollaborationState } from '@/types/collaboration';
import type { AppContextValue } from '@/types/app-context';
import type { AppSocket, ConnectionStatus } from '@/types/socket-events';
import type { User } from '@/types/user';

export const AppProvider = ({ children }: PropsWithChildren): ReactElement => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<readonly User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [socket] = useState<AppSocket>(() => socketService.createSocket());
  const [collaboration] = useState<CollaborationState>(() => {
    const document = new Y.Doc();
    const awareness = new Awareness(document);

    return {
      document,
      awareness,
      provider: {
        awareness
      }
    };
  });

  const value = useMemo<AppContextValue>(
    () => ({
      username,
      setUsername,
      roomId,
      setRoomId,
      connectionStatus,
      setConnectionStatus,
      socket,
      onlineUsers,
      setOnlineUsers,
      currentUser,
      setCurrentUser,
      editor,
      setEditor,
      collaboration
    }),
    [collaboration, connectionStatus, currentUser, editor, onlineUsers, roomId, socket, username]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
