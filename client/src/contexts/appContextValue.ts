import { createContext } from 'react';

import type { AppContextValue } from '@/types/app-context';

export const AppContext = createContext<AppContextValue | null>(null);
