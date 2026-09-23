import { Link, Outlet } from 'react-router-dom';
import Icon from '../../components/common/Icon/Icon';

/**
 * AuthLayout
 *
 * Full-screen shell for the web app's sign-in flow: a slim header with the
 * wordmark and a way back to the public site, laid over the blueprint grid.
 */
function AuthLayout() {
  const year = new Date().getFullYear();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white">
      <div
        className="bg-blueprint-grid pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      {/* Soft glow so the grid fades out toward the bottom */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_60%),radial-gradient(ellipse_at_bottom,white_25%,transparent_75%)]"
        aria-hidden="true"
      />

      <header className="relative">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-bold tracking-tight text-gray-900">
            BuildOpt <span className="text-blue-600">5.0</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            <span>
              <span className="hidden sm:inline">Back to </span>website
            </span>
          </Link>
        </div>
      </header>

      <main className="relative flex-1">
        <Outlet />
      </main>

      <footer className="relative">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 font-mono text-[11px] tracking-widest text-gray-400 sm:flex-row sm:px-6 lg:px-8">
          <span>© {year} BUILDOPT · SITE OS v5.0</span>
          <span>ACCOUNTS ARE MANAGED BY YOUR COMPANY ADMIN</span>
        </div>
      </footer>
    </div>
  );
}

export default AuthLayout;
