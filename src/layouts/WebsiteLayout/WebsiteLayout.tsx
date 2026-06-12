import { Outlet } from 'react-router-dom';
import Navbar from '../../components/website/Navbar/Navbar';
import Footer from '../../components/website/Footer/Footer';

/**
 * WebsiteLayout
 *
 * Shared shell for all public marketing pages: a persistent navbar and footer
 * with the active page rendered in between via <Outlet />.
 */
function WebsiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default WebsiteLayout;
