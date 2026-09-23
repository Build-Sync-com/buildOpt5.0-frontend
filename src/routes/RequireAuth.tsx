import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/auth/useAuth';

/**
 * RequireAuth
 *
 * Route guard for the web app: renders its children only when someone is
 * signed in, otherwise sends them to the start of the sign-in flow.
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}

export default RequireAuth;
