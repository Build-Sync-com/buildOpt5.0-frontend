import type { IconName } from '../components/common/Icon/Icon';
import type { RoleId } from '../types/auth';
import type {
  AttendanceMark,
  Employment,
  PpeItemId,
  ReleaseReason,
  SkillGrade,
  TradeId,
} from '../types/labor';

/**
 * Trades, grades, muster marks, PPE and permissions for labor.
 */
export const trades: { id: TradeId; label: string; plural: string; hint: string; icon: IconName; grade: SkillGrade }[] = [
  { id: 'mason', label: 'Mason', plural: 'masons', hint: 'Brickwork, blockwork, plastering', icon: 'brickWall', grade: 'skilled' },
  { id: 'carpenter', label: 'Carpenter', plural: 'carpenters', hint: 'Formwork, shuttering, joinery', icon: 'hammer', grade: 'skilled' },
  { id: 'steel-fixer', label: 'Steel fixer', plural: 'steel fixers', hint: 'Bar bending and rebar fixing', icon: 'grid3x3', grade: 'skilled' },
  { id: 'concretor', label: 'Concretor', plural: 'concretors', hint: 'Pouring, vibrating, finishing', icon: 'cylinder', grade: 'semi-skilled' },
  { id: 'tiler', label: 'Tile layer', plural: 'tile layers', hint: 'Floor and wall tiling', icon: 'layoutGrid', grade: 'skilled' },
  { id: 'painter', label: 'Painter', plural: 'painters', hint: 'Skim coat, primer, finishes', icon: 'paintRoller', grade: 'skilled' },
  { id: 'plumber', label: 'Plumber', plural: 'plumbers', hint: 'Water supply and drainage', icon: 'droplets', grade: 'skilled' },
  { id: 'electrician', label: 'Electrician', plural: 'electricians', hint: 'Conduits, wiring, temporary power', icon: 'plug', grade: 'skilled' },
  { id: 'welder', label: 'Welder', plural: 'welders', hint: 'Steel fabrication and welding', icon: 'flame', grade: 'skilled' },
  { id: 'scaffolder', label: 'Scaffolder', plural: 'scaffolders', hint: 'Erecting and striking scaffolds', icon: 'construction', grade: 'semi-skilled' },
  { id: 'operator', label: 'Machine operator', plural: 'operators', hint: 'Excavators, loaders, rollers', icon: 'tractor', grade: 'skilled' },
  { id: 'driver', label: 'Driver', plural: 'drivers', hint: 'Tippers, bowsers, site vehicles', icon: 'truck', grade: 'semi-skilled' },
  { id: 'helper', label: 'Helper', plural: 'helpers', hint: 'General labour, carrying, cleaning', icon: 'shovel', grade: 'unskilled' },
  { id: 'watcher', label: 'Watcher', plural: 'watchers', hint: 'Gate and night security', icon: 'shield', grade: 'unskilled' },
];

export function getTrade(id: TradeId) {
  return trades.find((t) => t.id === id) ?? trades[0];
}

/** `rate` is the day rate offered when registering, in rupees. */
export const grades: { id: SkillGrade; label: string; hint: string; rate: number }[] = [
  { id: 'foreman', label: 'Foreman', hint: 'Leads a gang', rate: 6500 },
  { id: 'skilled', label: 'Skilled', hint: 'Tradesman · baas', rate: 5000 },
  { id: 'semi-skilled', label: 'Semi-skilled', hint: 'Assists a trade', rate: 4000 },
  { id: 'unskilled', label: 'Unskilled', hint: 'Helper', rate: 3200 },
];

export function getGrade(id: SkillGrade) {
  return grades.find((g) => g.id === id) ?? grades[1];
}

export const employments: { id: Employment; label: string; hint: string }[] = [
  { id: 'direct', label: 'Direct', hint: 'On the company payroll' },
  { id: 'subcontract', label: 'Labour contractor', hint: 'Supplied and paid by a contractor' },
];

/** `worked` is how much of a day's wage the mark earns. */
export const attendanceMarks: { id: AttendanceMark; label: string; short: string; worked: number }[] = [
  { id: 'present', label: 'Present', short: 'P', worked: 1 },
  { id: 'half-day', label: 'Half day', short: '½', worked: 0.5 },
  { id: 'absent', label: 'Absent', short: 'A', worked: 0 },
  { id: 'leave', label: 'Leave', short: 'L', worked: 0 },
];

export function getAttendanceMark(id: AttendanceMark) {
  return attendanceMarks.find((m) => m.id === id) ?? attendanceMarks[0];
}

export const ppeItems: { id: PpeItemId; label: string }[] = [
  { id: 'helmet', label: 'Safety helmet' },
  { id: 'boots', label: 'Safety boots' },
  { id: 'vest', label: 'Reflective vest' },
  { id: 'gloves', label: 'Gloves' },
  { id: 'harness', label: 'Safety harness' },
];

/** PPE every worker must have before starting work; a harness is only for work at height. */
export const REQUIRED_PPE: PpeItemId[] = ['helmet', 'boots', 'vest'];

export const releaseReasons: { id: ReleaseReason; label: string }[] = [
  { id: 'completed', label: 'Their work is finished' },
  { id: 'transferred', label: 'Transferred to another site' },
  { id: 'resigned', label: 'Left on their own' },
  { id: 'dismissed', label: 'Dismissed' },
  { id: 'other', label: 'Other' },
];

export function getReleaseReason(id: ReleaseReason) {
  return releaseReasons.find((r) => r.id === id) ?? releaseReasons[0];
}

/** Activities offered when allocating; anything else can be typed in. */
export const activitySuggestions = [
  'Excavation for footings',
  'Rebar fixing',
  'Column formwork',
  'Slab shuttering',
  'Concreting',
  'Brickwork',
  'Blockwork',
  'Plastering',
  'Floor screed',
  'Floor tiling',
  'Wall tiling',
  'Electrical conduiting',
  'Plumbing first fix',
  'Painting',
  'Scaffolding',
  'Material unloading',
  'Site cleaning',
  'Site security',
];

/** Work fronts offered as suggestions alongside ones already in use. */
export const locationSuggestions = [
  'Block A · Ground floor',
  'Block A · Level 1',
  'Block A · Level 2',
  'Block A · Level 3',
  'Block B · Ground floor',
  'Block B · Level 1',
  'Block B · Level 2',
  'Car park',
  'Main store',
  'Site yard',
  'Main gate',
];

/** A normal working day; overtime is paid on top. */
export const STANDARD_HOURS = 8;
/** Overtime pays time and a half. */
export const OT_MULTIPLIER = 1.5;
/** No one under 18 works on a construction site. */
export const MIN_WORKING_AGE = 18;
/** How far back the muster roll can still be corrected. */
export const MUSTER_EDIT_DAYS = 7;
/** Most overtime in a day. */
export const MAX_OT_HOURS = 8;
/** First register number on a new site. */
export const FIRST_WORKER_NO = 1001;

/**
 * Roles that register and release workers, take the muster roll and
 * allocate work. Everyone else who can open the tab sees it read-only.
 */
export const laborRoles: RoleId[] = ['project-manager', 'engineer', 'assistant-engineer', 'site-admin'];
