import type { RoleId } from '../types/auth';
import type { NavSection, NavTab, NavTabId } from '../types/navigation';

/**
 * Sidebar tabs for the signed-in web app, and which roles can open each one.
 *
 * This is the one place to decide who sees what. Set a tab's `roles` to
 * 'all', or to a list of role ids (see RoleId in types/auth.ts), e.g.
 *
 *   roles: ['project-manager', 'store-keeper', 'quantity-surveyor'],
 *
 * The sidebar lists only the tabs the signed-in role can open, sections left
 * with no tabs are hidden, and opening a tab's URL without access redirects
 * to the role's first allowed tab. Keep the dashboard on 'all': sign-in lands
 * there.
 *
 * To add a tab: add its id to NavTabId, add it to a section below, then map
 * it to a page in routes/webappRoutes.tsx.
 */
export const navSections: NavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    tabs: [
      { id: 'dashboard', label: 'Dashboard', path: '', icon: 'layoutDashboard', roles: 'all' },
    ],
  },
  {
    id: 'site-work',
    label: 'Site work',
    tabs: [
      { id: 'tasks', label: 'Tasks', path: 'tasks', icon: 'listChecks', roles: 'all' },
      { id: 'inspections', label: 'Inspections', path: 'inspections', icon: 'clipboardCheck', roles: 'all' },
    ],
  },
  {
    id: 'resources',
    label: 'Site resources',
    tabs: [
      { id: 'labor', label: 'Labor', path: 'labor', icon: 'users', roles: 'all' },
      { id: 'materials', label: 'Materials', path: 'materials', icon: 'package', roles: 'all' },
      { id: 'machinery', label: 'Machinery & equipment', path: 'machinery', icon: 'cog', roles: 'all' },
    ],
  },
  {
    id: 'records',
    label: 'Records',
    tabs: [
      { id: 'reports', label: 'Reports', path: 'reports', icon: 'chartColumn', roles: 'all' },
      { id: 'documents', label: 'Documents', path: 'documents', icon: 'folder', roles: 'all' },
    ],
  },
];

/** Every tab, in sidebar order. */
export const navTabs: NavTab[] = navSections.flatMap((section) => section.tabs);

export function getTab(id: NavTabId): NavTab {
  const tab = navTabs.find((t) => t.id === id);
  if (!tab) throw new Error(`Unknown nav tab: ${id}`);
  return tab;
}

export function canAccessTab(roleId: RoleId, tab: NavTab): boolean {
  return tab.roles === 'all' || tab.roles.includes(roleId);
}

/** The tabs a role can open, in sidebar order. */
export function getTabsForRole(roleId: RoleId): NavTab[] {
  return navTabs.filter((tab) => canAccessTab(roleId, tab));
}

/** The sidebar for a role: only its allowed tabs, without empty sections. */
export function getNavSectionsForRole(roleId: RoleId): NavSection[] {
  return navSections
    .map((section) => ({
      ...section,
      tabs: section.tabs.filter((tab) => canAccessTab(roleId, tab)),
    }))
    .filter((section) => section.tabs.length > 0);
}

/** Absolute URL of a tab. */
export function tabHref(tab: NavTab): string {
  return tab.path ? `/app/${tab.path}` : '/app';
}
