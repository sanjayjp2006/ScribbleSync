import { useContext } from 'react';

import { AppContext } from '@/contexts/appContextValue';
import type { AppContextValue } from '@/types/app-context';

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);

  if (context === null) {
    throw new Error('useAppContext must be used within AppProvider.');
  }

  return context;
};
