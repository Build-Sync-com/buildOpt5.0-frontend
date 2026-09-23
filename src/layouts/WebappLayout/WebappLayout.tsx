import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppTopbar from '../../components/webapp/layout/AppTopbar/AppTopbar';
import AppSidebar from '../../components/webapp/layout/AppSidebar/AppSidebar';

/**
 * WebappLayout
 *
 * Shared shell for every signed-in web app page: the app top bar, the
 * role-based sidebar, and the active page rendered beside it via <Outlet />.
 */
function WebappLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const openNav = useCallback(() => setNavOpen(true), []);
  const closeNav = useCallback(() => setNavOpen(false), []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AppTopbar onMenuClick={openNav} />
      <div className="flex flex-1">
        <AppSidebar mobileOpen={navOpen} onClose={closeNav} />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default WebappLayout;
