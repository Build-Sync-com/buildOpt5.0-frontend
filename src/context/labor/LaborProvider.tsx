import type { ReactNode } from 'react';
import { LaborContext } from './LaborContext';
import { useLaborStore } from '../../hooks/useLaborStore';

/**
 * LaborProvider
 *
 * The site register, allocations and muster roll, shared across the web
 * app: the Labor page manages them, and the Tasks page reads them to show
 * how far each labour request has been filled. Mounted in the web app
 * layout, so nothing is lost moving between pages.
 */
export function LaborProvider({ children }: { children: ReactNode }) {
  const store = useLaborStore();
  return <LaborContext.Provider value={store}>{children}</LaborContext.Provider>;
}
