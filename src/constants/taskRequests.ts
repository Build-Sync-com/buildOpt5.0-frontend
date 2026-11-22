import type { RoleId } from '../types/auth';

/**
 * Who can raise requests from the program, and request numbering.
 */

/** Roles that can request labour, materials and machinery for a sub-task. Everyone else views. */
export const taskRequestRoles: RoleId[] = ['project-manager', 'engineer', 'assistant-engineer'];

/** First labour request number on a new site. */
export const FIRST_LABOR_REQUEST_NO = 301;

/** First material request number on a new site. */
export const FIRST_MATERIAL_REQUEST_NO = 501;

/** First machinery & equipment request number on a new site. */
export const FIRST_EQUIPMENT_REQUEST_NO = 701;

/** Most workers of one trade on a single request. */
export const MAX_WORKERS_PER_LINE = 50;

/** Requests needed within this many days are flagged on the incoming lists. */
export const REQUEST_SOON_DAYS = 2;

/** Most machines of one type on a single request. */
export const MAX_MACHINES_PER_LINE = 10;
