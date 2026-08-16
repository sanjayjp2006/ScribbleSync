import type { ReactElement } from 'react';

import type { User } from '@/types/user';

interface OnlineUsersProps {
  readonly users: readonly User[];
}

export const OnlineUsers = ({ users }: OnlineUsersProps): ReactElement => (
  <section aria-labelledby="online-users-title">
    <h2
      id="online-users-title"
      className="text-sm font-semibold uppercase tracking-normal text-slate-500"
    >
      Online Users
    </h2>

    {users.length === 0 ? (
      <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
        No users connected
      </p>
    ) : (
      <ul className="mt-4 space-y-3">
        {users.map((user) => (
          <li key={user.socketId} className="flex items-center gap-3 text-sm text-slate-700">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: user.color }}
              aria-hidden="true"
            />
            <span className="min-w-0 truncate">{user.name}</span>
          </li>
        ))}
      </ul>
    )}
  </section>
);
