import type { ReactElement } from 'react';

import type { ConnectionStatus as Status } from '@/types/socket-events';
import { cn } from '@/utils/className';

interface ConnectionStatusProps {
  readonly status: Status;
}

const statusLabel: Record<Status, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting',
  connected: 'Connected',
  error: 'Connection error'
};

export const ConnectionStatus = ({ status }: ConnectionStatusProps): ReactElement => (
  <footer className="border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 lg:px-6">
    <div className="mx-auto flex max-w-7xl items-center gap-2">
      <span
        className={cn(
          'h-2.5 w-2.5 rounded-full',
          status === 'connected' && 'bg-green-500',
          status === 'connecting' && 'bg-amber-500',
          status === 'disconnected' && 'bg-slate-400',
          status === 'error' && 'bg-red-500'
        )}
        aria-hidden="true"
      />
      <span>{statusLabel[status]}</span>
    </div>
  </footer>
);
