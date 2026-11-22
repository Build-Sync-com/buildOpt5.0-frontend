import { createContext } from 'react';
import type { useLaborStore } from '../../hooks/useLaborStore';

export type LaborContextValue = ReturnType<typeof useLaborStore>;

export const LaborContext = createContext<LaborContextValue | null>(null);
