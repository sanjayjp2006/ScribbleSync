import type { ReactElement } from 'react';

interface HeaderProps {
  readonly username: string;
  readonly roomId: string;
}

export const Header = ({ username, roomId }: HeaderProps): ReactElement => (
  <header className="border-b border-slate-200 bg-white">
    <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
      <h1 className="text-xl font-semibold text-slate-950">Realtime Collaborative Editor</h1>
      <p className="text-sm text-slate-600">
        {username} · Room {roomId}
      </p>
    </div>
  </header>
);
