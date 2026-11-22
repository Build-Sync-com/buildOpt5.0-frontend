import { createContext } from 'react';
import type { useMaterialStore } from '../../hooks/useMaterialStore';

export type MaterialsContextValue = ReturnType<typeof useMaterialStore>;

export const MaterialsContext = createContext<MaterialsContextValue | null>(null);
