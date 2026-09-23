import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../../common/Icon/Icon';
import { useAuth } from '../../../../context/auth/useAuth';

/**
 * AppTopbar
 *
 * Header for the signed-in web app: wordmark, the active role, the user and a
 * sign-out action. On smaller screens it also opens the sidebar drawer.
 */
function initials(name: string) {
  return (
    name
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || '?'
  );
}

type AppTopbarProps = {
  onMenuClick: () => void;
};

function AppTopbar({ onMenuClick }: AppTopbarProps) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  if (!session) return null;
  const { role, username } = session;

  const handleSignOut = () => {
    signOut();
    navigate('/signin', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="-ml-2 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <Link to="/app" className="text-xl font-bold tracking-tight text-gray-900">
            BuildOpt <span className="text-blue-600">5.0</span>
          </Link>
          <span className="hidden h-5 w-px bg-gray-200 sm:block" aria-hidden="true" />
          <span className="hidden text-sm text-gray-400 sm:block">Workspace</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 md:inline-flex">
            <Icon name={role.icon} className="h-4 w-4" />
            {role.title}
          </span>

          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-gray-900">
              {initials(username)}
            </span>
            <span className="hidden max-w-[10rem] truncate text-sm font-medium text-gray-900 lg:block">
              {username}
            </span>
          </span>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <Icon name="logOut" className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppTopbar;
