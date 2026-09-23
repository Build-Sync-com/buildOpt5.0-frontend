import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import RequireAuth from './RequireAuth';
import RequireTab from './RequireTab';
import WebappLayout from '../layouts/WebappLayout/WebappLayout';
import ErrorBoundary from '../components/common/ErrorBoundary/ErrorBoundary';
import { navTabs } from '../constants/webappNav';
import type { NavTabId } from '../types/navigation';
import Dashboard from '../pages/webapp/Dashboard/Dashboard';
import Tasks from '../pages/webapp/Tasks/Tasks';
import Inspections from '../pages/webapp/Inspections/Inspections';
import Labor from '../pages/webapp/Labor/Labor';
import Materials from '../pages/webapp/Materials/Materials';
import Machinery from '../pages/webapp/Machinery/Machinery';
import Reports from '../pages/webapp/Reports/Reports';
import Documents from '../pages/webapp/Documents/Documents';

/** The page each sidebar tab opens. */
const tabPages: Record<NavTabId, ReactNode> = {
  dashboard: <Dashboard />,
  tasks: <Tasks />,
  inspections: <Inspections />,
  labor: <Labor />,
  materials: <Materials />,
  machinery: <Machinery />,
  reports: <Reports />,
  documents: <Documents />,
};

/**
 * Signed-in web app routes, all under /app behind RequireAuth and the shared
 * WebappLayout. One route per sidebar tab (paths come from
 * constants/webappNav.ts), each guarded by the tab's role access. Unknown
 * /app URLs fall back to the dashboard.
 */
export const webappRoutes: RouteObject = {
  path: '/app',
  element: (
    <RequireAuth>
      <WebappLayout />
    </RequireAuth>
  ),
  errorElement: <ErrorBoundary />,
  children: [
    ...navTabs.map((tab): RouteObject => {
      const element = <RequireTab tabId={tab.id}>{tabPages[tab.id]}</RequireTab>;
      return tab.path ? { path: tab.path, element } : { index: true, element };
    }),
    { path: '*', element: <Navigate to="/app" replace /> },
  ],
};
