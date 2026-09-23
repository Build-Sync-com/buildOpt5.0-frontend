import type { RoleParty, RolePartyInfo, UserRole } from '../types/auth';

/**
 * Every role that can sign in to the BuildOpt web app, grouped by the party
 * they work for. Accounts themselves are created in the separate admin portal;
 * this list drives the sign-in flow and each role's workspace.
 */
export const roleParties: RolePartyInfo[] = [
  { id: 'contractor', label: 'Contractor · Site team' },
  { id: 'consultant', label: 'Consultant' },
  { id: 'client', label: 'Client' },
];

export const userRoles: UserRole[] = [
  // Contractor — site team
  {
    id: 'project-manager',
    title: 'Project Manager',
    qualifier: 'Site',
    party: 'contractor',
    workspace: ['Project overview & progress', 'Approvals & sign-offs', 'Cost and programme reports'],
    icon: 'briefcase',
  },
  {
    id: 'planning-engineer',
    title: 'Planning Engineer',
    qualifier: 'Site',
    party: 'contractor',
    workspace: ['Master & look-ahead programmes', 'Progress vs. baseline', 'Delay & resource planning'],
    icon: 'calendarRange',
  },
  {
    id: 'engineer',
    title: 'Engineer',
    party: 'contractor',
    workspace: ['Daily tasks & crew allocation', 'Material requests', 'Site diary & progress logs'],
    icon: 'hardHat',
  },
  {
    id: 'assistant-engineer',
    title: 'Assistant Engineer',
    party: 'contractor',
    workspace: ['Assigned tasks', 'Labor attendance', 'Measurement sheets'],
    icon: 'ruler',
  },
  {
    id: 'qa-qc-engineer',
    title: 'QA/QC Engineer',
    party: 'contractor',
    workspace: ['Inspection requests', 'Material test records', 'NCRs & checklists'],
    icon: 'clipboardCheck',
  },
  {
    id: 'quantity-surveyor',
    title: 'Quantity Surveyor',
    qualifier: 'Contractor side',
    party: 'contractor',
    workspace: ['BOQ & measurements', 'Interim payment claims', 'Variations & cost tracking'],
    icon: 'calculator',
  },
  {
    id: 'site-admin',
    title: 'Admin',
    qualifier: 'Site',
    party: 'contractor',
    workspace: ['Staff & attendance', 'Site documents', 'Correspondence register'],
    icon: 'idCard',
  },
  {
    id: 'store-keeper',
    title: 'Store Keeper',
    party: 'contractor',
    workspace: ['Goods received notes', 'Material issues', 'Stock levels & reorders'],
    icon: 'warehouse',
  },

  // Consultant
  {
    id: 'consultant-engineer',
    title: 'Consultant Engineer',
    party: 'consultant',
    workspace: ['Submittals & approvals', 'Site instructions', 'Progress reviews'],
    icon: 'draftingCompass',
  },
  {
    id: 'consultant-qa-qc-engineer',
    title: 'Consultant QA/QC Engineer',
    party: 'consultant',
    workspace: ['Inspection approvals', 'Test witnessing', 'Quality audit trail'],
    icon: 'shieldCheck',
  },

  // Client
  {
    id: 'client',
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
