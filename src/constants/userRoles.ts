import type { RoleParty, RolePartyInfo, UserRole } from '../types/auth';

/**
 * Every role that can sign in to the BuildOpt web app, grouped by the party
 * they work for. Accounts themselves are created in the separate admin portal;
 * this list drives the sign-in flow and each role's workspace.
 */
export const roleParties: RolePartyInfo[] = [
  { id: 'contractor', code: 'GRP-A', label: 'Contractor · Site team' },
  { id: 'consultant', code: 'GRP-B', label: 'Consultant' },
  { id: 'client', code: 'GRP-C', label: 'Client' },
];

export const userRoles: UserRole[] = [
  // Contractor — site team
  {
    id: 'project-manager',
    code: 'R-01',
    title: 'Project Manager',
    qualifier: 'Site',
    party: 'contractor',
    workspace: ['Project overview & progress', 'Approvals & sign-offs', 'Cost and programme reports'],
    icon: 'briefcase',
  },
  {
    id: 'planning-engineer',
    code: 'R-02',
    title: 'Planning Engineer',
    qualifier: 'Site',
    party: 'contractor',
    workspace: ['Master & look-ahead programmes', 'Progress vs. baseline', 'Delay & resource planning'],
    icon: 'calendarRange',
  },
  {
    id: 'engineer',
    code: 'R-03',
    title: 'Engineer',
    party: 'contractor',
    workspace: ['Daily tasks & crew allocation', 'Material requests', 'Site diary & progress logs'],
    icon: 'hardHat',
  },
  {
    id: 'assistant-engineer',
    code: 'R-04',
    title: 'Assistant Engineer',
    party: 'contractor',
    workspace: ['Assigned tasks', 'Labor attendance', 'Measurement sheets'],
    icon: 'ruler',
  },
  {
    id: 'qa-qc-engineer',
    code: 'R-05',
    title: 'QA/QC Engineer',
    party: 'contractor',
    workspace: ['Inspection requests', 'Material test records', 'NCRs & checklists'],
    icon: 'clipboardCheck',
  },
  {
    id: 'quantity-surveyor',
    code: 'R-06',
    title: 'Quantity Surveyor',
    qualifier: 'Contractor side',
    party: 'contractor',
    workspace: ['BOQ & measurements', 'Interim payment claims', 'Variations & cost tracking'],
    icon: 'calculator',
  },
  {
    id: 'site-admin',
    code: 'R-07',
    title: 'Admin',
    qualifier: 'Site',
    party: 'contractor',
    workspace: ['Staff & attendance', 'Site documents', 'Correspondence register'],
    icon: 'idCard',
  },
  {
    id: 'store-keeper',
    code: 'R-08',
    title: 'Store Keeper',
    party: 'contractor',
    workspace: ['Goods received notes', 'Material issues', 'Stock levels & reorders'],
    icon: 'warehouse',
  },

  // Consultant
  {
    id: 'consultant-engineer',
    code: 'R-09',
    title: 'Consultant Engineer',
    party: 'consultant',
    workspace: ['Submittals & approvals', 'Site instructions', 'Progress reviews'],
    icon: 'draftingCompass',
  },
  {
    id: 'consultant-qa-qc-engineer',
    code: 'R-10',
    title: 'Consultant QA/QC Engineer',
    party: 'consultant',
    workspace: ['Inspection approvals', 'Test witnessing', 'Quality audit trail'],
    icon: 'shieldCheck',
  },

  // Client
  {
    id: 'client',
    code: 'R-11',
    title: 'Client',
    party: 'client',
    workspace: ['Progress overview', 'Milestones & payments', 'Reports & documents'],
    icon: 'building',
  },
];

export function getRoleById(id: string): UserRole | undefined {
  return userRoles.find((role) => role.id === id);
}

export function getRolesByParty(party: RoleParty): UserRole[] {
  return userRoles.filter((role) => role.party === party);
}

export function getParty(party: RoleParty): RolePartyInfo {
  return roleParties.find((p) => p.id === party) ?? roleParties[0];
}
