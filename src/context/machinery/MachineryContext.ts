import { createContext } from 'react';
import type { useMachineryStore } from '../../hooks/useMachineryStore';

export type MachineryContextValue = ReturnType<typeof useMachineryStore>;

export const MachineryContext = createContext<MachineryContextValue | null>(null);
