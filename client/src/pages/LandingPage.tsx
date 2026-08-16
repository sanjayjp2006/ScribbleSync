import type { ReactElement } from 'react';

import { LandingCard } from '@/components/LandingCard';

export const LandingPage = (): ReactElement => (
  <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
    <LandingCard />
  </main>
);
