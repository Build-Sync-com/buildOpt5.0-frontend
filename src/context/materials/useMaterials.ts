import { useContext } from 'react';
import { MaterialsContext } from './MaterialsContext';

/** The materials store. Must be used under <MaterialsProvider>. */
export function useMaterials() {
  const context = useContext(MaterialsContext);
  if (!context) {
    throw new Error('useMaterials must be used within a MaterialsProvider');
  }
  return context;
}
