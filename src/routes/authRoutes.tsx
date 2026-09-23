import type { RouteObject } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout/AuthLayout';
import ErrorBoundary from '../components/common/ErrorBoundary/ErrorBoundary';
import RoleSelect from '../pages/webapp/auth/RoleSelect/RoleSelect';
import SignIn from '../pages/webapp/auth/SignIn/SignIn';

/**
 * Web app sign-in flow: pick a role (/signin), then enter credentials for it
 * (/signin/:roleId). Sign-up lives in the separate admin portal.
 */
export const authRoutes: RouteObject = {
  path: '/signin',
  element: <AuthLayout />,
  errorElement: <ErrorBoundary />,
  children: [
    { index: true, element: <RoleSelect /> },
    { path: ':roleId', element: <SignIn /> },
  ],
};
