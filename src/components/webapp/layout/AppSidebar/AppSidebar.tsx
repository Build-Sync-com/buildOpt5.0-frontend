import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Icon from '../../../common/Icon/Icon';
import { useAuth } from '../../../../context/auth/useAuth';
import { getNavSectionsForRole, tabHref } from '../../../../constants/webappNav';
import type { UserRole } from '../../../../types/auth';
import type { NavSection } from '../../../../types/navigation';

/**
 * AppSidebar
 *
 * Tab navigation for the signed-in web app. Shows only the tabs the signed-in
 * role can open (see constants/webappNav.ts). Docked on large screens; on
 * smaller screens it slides in as a drawer opened from the top bar.
 */
type AppSidebarProps = {
  /** Whether the small-screen drawer is open. */
  mobileOpen: boolean;
  onClose: () => void;
};

type SidebarNavProps = {
  sections: NavSection[];
  onNavigate?: () => void;
};

function SidebarNav({ sections, onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label="Workspace" className="flex-1 overflow-y-auto px-3 py-5">
      {sections.map((section) => (
        <div key={section.id} className="mb-6 last:mb-0">
          <p className="px-3 text-xs font-semibold text-gray-400">{section.label}</p>
          <ul className="mt-2 space-y-0.5">
            {section.tabs.map((tab) => (
              <li key={tab.id}>
                <NavLink
                  to={tabHref(tab)}
                  end={!tab.path}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        name={tab.icon}
                        className={`h-[18px] w-[18px] shrink-0 ${
                          isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                        }`}
                      />
                      <span className="truncate">{tab.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarRole({ role, tabCount }: { role: UserRole; tabCount: number }) {
  return (
    <div className="border-t border-dashed border-gray-200 p-3">
      <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Icon name={role.icon} className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{role.title}</p>
          <p className="text-xs text-gray-400">
            {tabCount} {tabCount === 1 ? 'tab' : 'tabs'}
          </p>
        </div>
      </div>
    </div>
  );
}

function AppSidebar({ mobileOpen, onClose }: AppSidebarProps) {
  const { session } = useAuth();

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onClose]);

  if (!session) return null;
  const { role } = session;
  const sections = getNavSectionsForRole(role.id);
  const tabCount = sections.reduce((count, section) => count + section.tabs.length, 0);

  return (
    <>
      {/* Docked sidebar — large screens */}
      <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-72 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <SidebarNav sections={sections} />
        <SidebarRole role={role} tabCount={tabCount} />
      </aside>

      {/* Drawer — small screens */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}
        inert={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-gray-900/40 transition-opacity duration-200 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
          aria-hidden="true"
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Workspace navigation"
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-xl transition-transform duration-200 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4">
            <Link
              to="/app"
              onClick={onClose}
              className="text-xl font-bold tracking-tight text-gray-900"
            >
              BuildOpt <span className="text-blue-600">5.0</span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <Icon name="x" className="h-5 w-5" />
            </button>
          </div>
          <SidebarNav sections={sections} onNavigate={onClose} />
          <SidebarRole role={role} tabCount={tabCount} />
        </aside>
      </div>
    </>
  );
}

export default AppSidebar;
