import type { ReactNode } from 'react';
import { MachineryContext } from './MachineryContext';
import { useMachineryStore } from '../../hooks/useMachineryStore';

/**
 * MachineryProvider
 *
 * Machines, tools, receipts, returns and tool slips, shared across the web
 * app: the Machinery page runs them, and the Tasks page reads them for
 * what's on site and to show how far each equipment request has been
 * checked out. Mounted in the web app layout, so nothing is lost moving
 * between pages.
 */
export function MachineryProvider({ children }: { children: ReactNode }) {
  const store = useMachineryStore();
  return <MachineryContext.Provider value={store}>{children}</MachineryContext.Provider>;
}
