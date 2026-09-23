import type { IconName } from '../components/common/Icon/Icon';

/** Which side of the contract a role works for. */
export type RoleParty = 'contractor' | 'consultant' | 'client';

/** URL-safe identifier for every role that can sign in to the web app. */
export type RoleId =
  | 'project-manager'
  | 'planning-engineer'
  | 'engineer'
  | 'assistant-engineer'
  | 'qa-qc-engineer'
  | 'quantity-surveyor'
  | 'site-admin'
  | 'store-keeper'
  | 'consultant-engineer'
  | 'consultant-qa-qc-engineer'
  | 'client';

export type UserRole = {
  id: RoleId;
  /** Drawing-style reference shown on cards, e.g. "R-01". */
  code: string;
  title: string;
  /** Extra org-chart context, e.g. "Site" or "Contractor side". */
  qualifier?: string;
  party: RoleParty;
  /** Areas of BuildOpt this role works in. */
  workspace: string[];
  icon: IconName;
};

export type RolePartyInfo = {
  id: RoleParty;
  code: string;
  label: string;
};

/** The signed-in user, as held by the auth context. */
export type Session = {
  username: string;
  role: UserRole;
  signedInAt: string;
};

export type SignInCredentials = {
  roleId: RoleId;
  username: string;
  password: string;
  remember: boolean;
};
