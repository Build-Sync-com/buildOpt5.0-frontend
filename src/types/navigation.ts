import type { IconName } from '../components/common/Icon/Icon';
import type { RoleId } from './auth';

/** Identifier for every tab in the web app sidebar. */
export type NavTabId =
  | 'dashboard'
  | 'tasks'
  | 'inspections'
  | 'labor'
  | 'materials'
  | 'machinery'
  | 'reports'
  | 'documents';

/** Who can open a tab: every role, or only the listed ones. */
export type TabAccess = 'all' | RoleId[];

export type NavTab = {
  id: NavTabId;
  label: string;
  /** Path segment under /app; an empty string is the /app index. */
  path: string;
  icon: IconName;
  roles: TabAccess;
};

export type NavSection = {
  id: string;
  label: string;
  tabs: NavTab[];
};
