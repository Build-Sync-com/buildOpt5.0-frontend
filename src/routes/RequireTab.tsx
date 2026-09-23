import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/auth/useAuth';
import { canAccessTab, getTab, getTabsForRole, tabHref } from '../constants/webappNav';
import type { NavTabId } from '../types/navigation';

/**
 * RequireTab
 *
 * Route guard for a sidebar tab: renders the page only when the signed-in
 * role can open that tab (see constants/webappNav.ts), otherwise redirects to
 * the role's first allowed tab. Used inside RequireAuth.
 */
type RequireTabProps = {
  tabId: NavTabId;
  children: ReactNode;
};

function RequireTab({ tabId, children }: RequireTabProps) {
  const { session } = useAuth();
  if (!session) return null;

  if (canAccessTab(session.role.id, getTab(tabId))) {
    return children;
  }

  const fallback = getTabsForRole(session.role.id)[0];
  if (fallback) {
    return <Navigate to={tabHref(fallback)} replace />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <p className="font-semibold text-gray-900">No tabs assigned</p>
      <p className="mt-2 text-gray-500">
        Your role doesn't have access to any workspace tabs yet. Ask your company admin.
      </p>
    </div>
  );
}

export default RequireTab;
