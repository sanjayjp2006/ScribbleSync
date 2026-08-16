import { useEffect, type ReactElement } from 'react';
import { Navigate } from 'react-router-dom';

import { ConnectionStatus } from '@/components/ConnectionStatus';
import { DrawingCanvas } from '@/components/DrawingCanvas';
import { EditorContainer } from '@/components/EditorContainer';
import { Header } from '@/components/Header';
import { OnlineUsers } from '@/components/OnlineUsers';
import { Sidebar } from '@/components/Sidebar';
import { useAppContext } from '@/hooks/useAppContext';
import { useCollaborationTransport } from '@/hooks/useCollaborationTransport';
import { useEditor } from '@/hooks/useEditor';

export const EditorPage = (): ReactElement => {
  const { username, roomId, onlineUsers, setEditor, connectionStatus, collaboration, currentUser } =
    useAppContext();
  const editor = useEditor({
    document: collaboration.document,
    provider: collaboration.provider,
    user: {
      name: username,
      color: currentUser?.color ?? '#2563eb'
    }
  });

  useCollaborationTransport();

  useEffect(() => {
    editor?.commands.updateUser({
      name: username,
      color: currentUser?.color ?? '#2563eb'
    });
  }, [currentUser?.color, editor, username]);

  useEffect(() => {
    setEditor(editor);

    return () => {
      setEditor(null);
    };
  }, [editor, setEditor]);

  if (username.length === 0 || roomId.length === 0) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Header username={username} roomId={roomId} />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row">
        <Sidebar>
          <OnlineUsers users={onlineUsers} />
        </Sidebar>
        <main className="flex-1 p-4 lg:p-6">
          <EditorContainer editor={editor} />
          <DrawingCanvas />
        </main>
      </div>
      <ConnectionStatus status={connectionStatus} />
    </div>
  );
};
