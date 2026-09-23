import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import RequireAuth from './RequireAuth';
import WebappLayout from '../layouts/WebappLayout/WebappLayout';
import ErrorBoundary from '../components/common/ErrorBoundary/ErrorBoundary';
import Dashboard from '../pages/webapp/Dashboard/Dashboard';

/**
 * Signed-in web app routes, all under /app behind RequireAuth and the shared
 * WebappLayout. Unknown /app URLs fall back to the dashboard.
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
    { index: true, element: <Dashboard /> },
    { path: '*', element: <Navigate to="/app" replace /> },
  ],
};
