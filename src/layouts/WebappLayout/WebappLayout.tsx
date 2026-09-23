import { Outlet } from 'react-router-dom';
import AppTopbar from '../../components/webapp/layout/AppTopbar/AppTopbar';

/**
 * WebappLayout
 *
 * Shared shell for every signed-in web app page: the app top bar with the
 * active page rendered underneath via <Outlet />.
 */
function WebappLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AppTopbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default WebappLayout;
