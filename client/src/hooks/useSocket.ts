import { useCallback } from 'react';

import { socketService } from '@/services/socketService';
import { useAppContext } from '@/hooks/useAppContext';

export const useSocket = () => {
  const { socket, connectionStatus, setConnectionStatus } = useAppContext();

  const connect = useCallback(() => {
    try {
      setConnectionStatus('connecting');
      socketService.connect(socket);
      setConnectionStatus(socket.connected ? 'connected' : 'connecting');
    } catch {
      setConnectionStatus('error');
    }
  }, [setConnectionStatus, socket]);

  const disconnect = useCallback(() => {
    try {
      socketService.disconnect(socket);
      setConnectionStatus('disconnected');
    } catch {
      setConnectionStatus('error');
    }
  }, [setConnectionStatus, socket]);

  return {
    socket,
    connectionStatus,
    connect,
    disconnect
  };
};
