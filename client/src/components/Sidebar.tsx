import type { PropsWithChildren, ReactElement } from 'react';

export const Sidebar = ({ children }: PropsWithChildren): ReactElement => (
  <aside className="w-full border-b border-slate-200 bg-white p-4 lg:w-72 lg:border-b-0 lg:border-r">
    {children}
  </aside>
);
