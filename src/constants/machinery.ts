import type { IconName } from '../components/common/Icon/Icon';
import type { RoleId } from '../types/auth';
import type {
  ArrivalCheckId,
  Condition,
  FuelLevel,
  MachineCategoryId,
  MachineStatus,
  MeterKind,
  RateBasis,
  ToolCategoryId,
} from '../types/machinery';

/**
 * Categories, machine types, checks and permissions for machinery &
 * equipment.
 */
export const machineCategories: { id: MachineCategoryId; label: string; icon: IconName }[] = [
  { id: 'earthmoving', label: 'Earthmoving', icon: 'tractor' },
  { id: 'lifting', label: 'Lifting & handling', icon: 'forklift' },
  { id: 'compaction', label: 'Compaction', icon: 'layers' },
  { id: 'concrete', label: 'Concrete plant', icon: 'cylinder' },
  { id: 'power', label: 'Power, air & pumps', icon: 'zap' },
  { id: 'transport', label: 'Site transport', icon: 'truck' },
];

export function getMachineCategory(id: MachineCategoryId) {
  return machineCategories.find((c) => c.id === id) ?? machineCategories[0];
}

/**
 * Machine types offered when receiving, each with the meter it usually has.
 * Anything not listed can be entered as "Other".
 */
export const machineTypes: { label: string; category: MachineCategoryId; meter: MeterKind }[] = [
  { label: 'Excavator', category: 'earthmoving', meter: 'hours' },
  { label: 'Mini excavator', category: 'earthmoving', meter: 'hours' },
  { label: 'Backhoe loader', category: 'earthmoving', meter: 'hours' },
  { label: 'Bulldozer', category: 'earthmoving', meter: 'hours' },
  { label: 'Wheel loader', category: 'earthmoving', meter: 'hours' },
  { label: 'Skid steer loader', category: 'earthmoving', meter: 'hours' },
  { label: 'Motor grader', category: 'earthmoving', meter: 'hours' },
  { label: 'Mobile crane', category: 'lifting', meter: 'hours' },
  { label: 'Tower crane', category: 'lifting', meter: 'hours' },
  { label: 'Telehandler', category: 'lifting', meter: 'hours' },
  { label: 'Forklift', category: 'lifting', meter: 'hours' },
  { label: 'Material hoist', category: 'lifting', meter: 'none' },
  { label: 'Vibratory roller', category: 'compaction', meter: 'hours' },
  { label: 'Plate compactor', category: 'compaction', meter: 'none' },
  { label: 'Tamping rammer', category: 'compaction', meter: 'none' },
  { label: 'Concrete mixer', category: 'concrete', meter: 'hours' },
  { label: 'Concrete pump', category: 'concrete', meter: 'hours' },
  { label: 'Transit mixer', category: 'concrete', meter: 'km' },
  { label: 'Poker vibrator', category: 'concrete', meter: 'none' },
  { label: 'Power float', category: 'concrete', meter: 'none' },
  { label: 'Generator', category: 'power', meter: 'hours' },
  { label: 'Air compressor', category: 'power', meter: 'hours' },
  { label: 'Water pump', category: 'power', meter: 'hours' },
  { label: 'Welding plant', category: 'power', meter: 'hours' },
  { label: 'Tipper truck', category: 'transport', meter: 'km' },
  { label: 'Water bowser', category: 'transport', meter: 'km' },
  { label: 'Tractor & trailer', category: 'transport', meter: 'hours' },
];

export const toolCategories: { id: ToolCategoryId; label: string; icon: IconName }[] = [
  { id: 'hand', label: 'Hand tools', icon: 'hammer' },
  { id: 'power-tools', label: 'Power tools', icon: 'drill' },
  { id: 'measuring', label: 'Measuring & levelling', icon: 'ruler' },
  { id: 'access', label: 'Access & scaffolding', icon: 'construction' },
  { id: 'safety', label: 'Safety equipment', icon: 'hardHat' },
  { id: 'site', label: 'Site equipment', icon: 'shovel' },
];

export function getToolCategory(id: ToolCategoryId) {
  return toolCategories.find((c) => c.id === id) ?? toolCategories[0];
}

export const meterKinds: { id: MeterKind; label: string; unit: string; short: string }[] = [
  { id: 'hours', label: 'Hour meter', unit: 'hours', short: 'hrs' },
  { id: 'km', label: 'Odometer', unit: 'km', short: 'km' },
  { id: 'none', label: 'No meter', unit: '', short: '' },
];

export function getMeterKind(id: MeterKind) {
  return meterKinds.find((m) => m.id === id) ?? meterKinds[0];
}

export const rateBases: { id: RateBasis; label: string; per: string }[] = [
  { id: 'hour', label: 'Per hour', per: 'hr' },
  { id: 'day', label: 'Per day', per: 'day' },
  { id: 'month', label: 'Per month', per: 'month' },
];

export const fuelLevels: { id: FuelLevel; label: string }[] = [
  { id: 0, label: 'Empty' },
  { id: 1, label: '¼' },
  { id: 2, label: '½' },
  { id: 3, label: '¾' },
  { id: 4, label: 'Full' },
];

export const conditions: { id: Condition; label: string; hint: string }[] = [
  { id: 'good', label: 'Good', hint: 'Ready to work' },
  { id: 'fair', label: 'Fair', hint: 'Wear noted' },
  { id: 'poor', label: 'Poor', hint: 'Needs repair' },
];

export function getCondition(id: Condition) {
  return conditions.find((c) => c.id === id) ?? conditions[0];
}

export const machineStatuses: { id: MachineStatus; label: string; hint: string }[] = [
  { id: 'working', label: 'Working', hint: 'On the job' },
  { id: 'idle', label: 'Idle', hint: 'On site, not in use' },
  { id: 'breakdown', label: 'Breakdown', hint: 'Waiting for repair' },
];

/** Ticked off when a machine arrives, before it's put to work. */
export const arrivalChecks: { id: ArrivalCheckId; label: string }[] = [
  { id: 'documents', label: 'Insurance and revenue licence seen' },
  { id: 'operator', label: 'Operator’s licence checked' },
  { id: 'safety', label: 'Reverse alarm, lights and horn work' },
  { id: 'leaks', label: 'No oil, fuel or hydraulic leaks' },
  { id: 'guards', label: 'Guards and covers in place' },
];

/** Segments of a tool's availability bar, with the legend under the tool list. */
export const availabilitySegments = [
  { key: 'available', label: 'In store', className: 'bg-blue-600' },
  { key: 'out', label: 'Out', className: 'bg-amber-400' },
  { key: 'damaged', label: 'Damaged', className: 'bg-red-400' },
] as const;

/** Owner name offered for machines and tools from the company's own yard. */
export const COMPANY_YARD = 'Head office plant yard';

/** Storage spots offered as suggestions for tools. */
export const toolLocations = ['Tool store', 'Main store', 'Scaffold yard', 'Site office'];

/** Flag a machine this many days before its off-hire date. */
export const DUE_SOON_DAYS = 3;

/**
 * Roles that receive and send back equipment, log machines and lend tools.
 * Everyone else who can open the tab sees it read-only.
 */
export const machineryRoles: RoleId[] = ['store-keeper', 'project-manager', 'engineer'];
