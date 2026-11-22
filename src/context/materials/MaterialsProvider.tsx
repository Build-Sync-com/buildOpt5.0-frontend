import type { ReactNode } from 'react';
import { MaterialsContext } from './MaterialsContext';
import { useMaterialStore } from '../../hooks/useMaterialStore';

/**
 * MaterialsProvider
 *
 * The materials store - catalog, batches, deliveries and issues - shared
 * across the web app: the Materials page runs it, and the Tasks page reads
 * it for stock levels and to show how far each material request has been
 * issued. Mounted in the web app layout, so nothing is lost moving between
 * pages.
 */
export function MaterialsProvider({ children }: { children: ReactNode }) {
  const store = useMaterialStore();
  return <MaterialsContext.Provider value={store}>{children}</MaterialsContext.Provider>;
}
