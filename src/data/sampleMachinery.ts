import { COMPANY_YARD, arrivalChecks, machineTypes } from '../constants/machinery';
import { addDays, todayISO } from '../utils/materials';
import type {
  CheckoutDraft,
  EquipmentReceiptDraft,
  EquipmentReturnDraft,
  MachineDraft,
  MachineLogDraft,
  MachineStatus,
  Ownership,
  Tool,
  ToolCheckIn,
  ToolReturnLine,
} from '../types/machinery';

/**
 * Sample machinery history until the machinery API exists.
 *
 * As with materials, the site starts empty and replays these events in
 * order (see hooks/useMachineryStore.ts), so hire bills, meter usage and tool
 * counts come out of the same logic the forms use. Events name machines by
 * registration and tool slips by a tag; dates are relative to today.
 */
export const sampleTools: Tool[] = [
  { id: 'mammoty', name: 'Mammoty', spec: 'Forged head · wooden handle', category: 'hand', location: 'Tool store' },
  { id: 'sledge-hammer', name: 'Sledge hammer', spec: '4 kg · fibreglass handle', category: 'hand', location: 'Tool store' },
  { id: 'claw-hammer', name: 'Claw hammer', spec: '450 g · steel shaft', category: 'hand', location: 'Tool store' },
  { id: 'trowel', name: 'Brick trowel', spec: '10 in · forged steel', category: 'hand', location: 'Tool store' },
  { id: 'rebar-cutter', name: 'Rebar cutter & bender', spec: 'Manual · up to 16 mm', category: 'hand', location: 'Tool store' },
  { id: 'angle-grinder', name: 'Angle grinder', spec: '115 mm · 850 W', category: 'power-tools', location: 'Tool store' },
  { id: 'hammer-drill', name: 'Hammer drill', spec: 'SDS-plus · 800 W', category: 'power-tools', location: 'Tool store' },
  { id: 'spirit-level', name: 'Spirit level', spec: '1200 mm · aluminium', category: 'measuring', location: 'Tool store' },
  { id: 'measuring-tape', name: 'Measuring tape', spec: '30 m · fibreglass', category: 'measuring', location: 'Site office' },
  { id: 'laser-level', name: 'Rotary laser level', spec: 'With tripod and staff', category: 'measuring', location: 'Site office' },
  { id: 'scaffold-frame', name: 'Scaffold frame', spec: '1.7 m H-frame · with braces', category: 'access', location: 'Scaffold yard' },
  { id: 'steel-prop', name: 'Adjustable steel prop', spec: '2.0–3.5 m', category: 'access', location: 'Scaffold yard' },
  { id: 'ladder', name: 'Extension ladder', spec: '6 m · aluminium', category: 'access', location: 'Tool store' },
  { id: 'harness', name: 'Safety harness', spec: 'Full body · double lanyard', category: 'safety', location: 'Site office' },
  { id: 'shovel', name: 'Shovel', spec: 'Round mouth · steel handle', category: 'site', location: 'Tool store' },
  { id: 'wheelbarrow', name: 'Wheelbarrow', spec: '85 L · pneumatic tyre', category: 'site', location: 'Tool store' },
];

type SampleReturnDraft = Omit<EquipmentReturnDraft, 'machines' | 'tools'> & {
  machines: (Omit<EquipmentReturnDraft['machines'][number], 'machineId'> & { regNo: string })[];
  tools: Omit<ToolReturnLine, 'lotId'>[];
};

export type SampleEvent =
  | { kind: 'receive'; draft: EquipmentReceiptDraft }
  | { kind: 'log'; regNo: string; draft: Omit<MachineLogDraft, 'machineId'> }
  | { kind: 'extend'; regNo: string; dueBack: string; date: string; loggedBy: string }
  | { kind: 'return'; draft: SampleReturnDraft }
  | { kind: 'checkout'; tag: string; draft: CheckoutDraft }
  | { kind: 'checkIn'; tag: string; checkIn: ToolCheckIn };

const STORE_KEEPER = 'R. Bandara';
const ENGINEER = 'D. Wickramasinghe';

const ago = (days: number) => addDays(todayISO(), -days);
const inDays = (days: number) => addDays(todayISO(), days);

function machine(
  type: string,
  model: string,
  regNo: string,
  extra: Partial<MachineDraft> = {},
): MachineDraft {
  const known = machineTypes.find((t) => t.label === type);
  return {
    type,
    category: known?.category ?? 'power',
    model,
    regNo,
    meter: known?.meter ?? 'none',
    fuelIn: 4,
    conditionIn: 'good',
    checks: arrivalChecks.map((c) => c.id),
    ...extra,
  };
}

function receive(
  daysAgo: number,
  owner: string,
  ownership: Ownership,
  reference: string,
  items: { machines?: MachineDraft[]; tools?: EquipmentReceiptDraft['tools'] },
  extra: Partial<EquipmentReceiptDraft> = {},
): SampleEvent {
  return {
    kind: 'receive',
    draft: {
      receivedOn: ago(daysAgo),
      owner,
      ownership,
      reference,
      receivedBy: STORE_KEEPER,
      machines: items.machines ?? [],
      tools: items.tools ?? [],
      ...extra,
    },
  };
}

function log(
  daysAgo: number,
  regNo: string,
  status: MachineStatus,
  meterReading?: number,
  note?: string,
): SampleEvent {
  return {
    kind: 'log',
    regNo,
    draft: { date: ago(daysAgo), status, meterReading, note, loggedBy: ENGINEER },
  };
}

function checkout(
  tag: string,
  daysAgo: number,
  issuedTo: string,
  workArea: string,
  dueBack: string,
  lines: CheckoutDraft['lines'],
): SampleEvent {
  return {
    kind: 'checkout',
    tag,
    draft: { checkedOutOn: ago(daysAgo), issuedTo, workArea, dueBack, issuedBy: STORE_KEEPER, lines },
  };
}

function checkIn(tag: string, daysAgo: number, lines: ToolCheckIn['lines'], note?: string): SampleEvent {
  return { kind: 'checkIn', tag, checkIn: { returnedOn: ago(daysAgo), receivedBy: STORE_KEEPER, note, lines } };
}

/** Site history, oldest first. */
export const sampleEvents: SampleEvent[] = [
  receive(45, COMPANY_YARD, 'company', 'TN 0217', {
    machines: [
      machine('Concrete mixer', 'Kirloskar 10/7 · diesel', 'HO-CM-14', { meterIn: 2210, fuelIn: 3 }),
      machine('Generator', 'Perkins 45 kVA · silent', 'HO-GN-22', { meterIn: 7340 }),
      machine('Poker vibrator', 'Wacker Neuson 45 mm · petrol', 'HO-PV-31', { fuelIn: 2 }),
    ],
    tools: [
      { toolId: 'shovel', quantity: 20 },
      { toolId: 'mammoty', quantity: 15 },
      { toolId: 'wheelbarrow', quantity: 10 },
      { toolId: 'sledge-hammer', quantity: 4 },
      { toolId: 'claw-hammer', quantity: 12 },
      { toolId: 'trowel', quantity: 15 },
      { toolId: 'rebar-cutter', quantity: 2 },
      { toolId: 'spirit-level', quantity: 6 },
      { toolId: 'measuring-tape', quantity: 4 },
      { toolId: 'laser-level', quantity: 1, remarks: 'Calibrated Aug 2026' },
      { toolId: 'angle-grinder', quantity: 3 },
      { toolId: 'hammer-drill', quantity: 2 },
      { toolId: 'ladder', quantity: 3 },
      { toolId: 'harness', quantity: 10 },
    ],
  }, { vehicleNo: 'WP LK-1120' }),
  receive(40, 'Lanka Plant Hire', 'hired', 'HA 5512', {
    machines: [
      machine('Vibratory roller', 'Dynapac CA250 · 10 t', 'LPH-RL-03', {
        meterIn: 1452,
        rate: { amount: 15000, basis: 'day' },
        operator: 'W. Gunasena',
        dueBack: ago(10),
      }),
    ],
  }, { vehicleNo: 'WP LY-7765', hireOrder: 'HO 2026/041' }),
  receive(38, 'Lanka Plant Hire', 'hired', 'HA 5530', {
    machines: [
      machine('Backhoe loader', 'JCB 3CX', 'WP KA-4471', {
        meterIn: 4120,
        rate: { amount: 18000, basis: 'day' },
        operator: 'S. Kumara',
        dueBack: ago(8),
        remarks: 'Rear bucket teeth worn - noted with supplier',
      }),
    ],
  }, { vehicleNo: 'WP LY-7765', hireOrder: 'HO 2026/044' }),
  receive(35, 'Mahaweli Equipment Rentals', 'hired', 'DN 3381', {
    tools: [
      { toolId: 'scaffold-frame', quantity: 60, dailyRate: 45 },
      { toolId: 'steel-prop', quantity: 120, dailyRate: 30 },
    ],
  }, { vehicleNo: 'NW LF-2290', hireOrder: 'HO 2026/047' }),
  log(30, 'HO-CM-14', 'working', 2265),
  log(30, 'WP KA-4471', 'working', 4168),
  log(30, 'LPH-RL-03', 'working', 1560),
  receive(30, 'Lanka Plant Hire', 'hired', 'HA 5561', {
    machines: [
      machine('Excavator', 'CAT 320D · 20 t', 'LPH-EX-07', {
        meterIn: 9810,
        rate: { amount: 6500, basis: 'hour' },
        operator: 'P. Nishantha',
        dueBack: ago(5),
        checks: ['documents', 'operator', 'safety', 'guards'],
        remarks: 'Minor hydraulic seep at boom cylinder - supplier to attend',
      }),
    ],
  }, { vehicleNo: 'WP LY-7765', hireOrder: 'HO 2026/052' }),
  log(25, 'LPH-EX-07', 'working', 9852),
  log(21, 'WP KA-4471', 'working', 4236),
  receive(20, 'Ruwan Tippers', 'hired', 'AG 118', {
    machines: [
      machine('Tipper truck', 'Isuzu Giga · 10 cube', 'WP LH-9031', {
        meterIn: 184220,
        rate: { amount: 22000, basis: 'day' },
        operator: 'M. Rizwan',
        dueBack: inDays(10),
      }),
    ],
  }),
  log(20, 'HO-GN-22', 'working', 7520),
  log(18, 'LPH-EX-07', 'working', 9915),
  receive(16, 'Mahaweli Equipment Rentals', 'hired', 'DN 3460', {
    machines: [
      machine('Water pump', 'Honda WB30 · 3 in', 'MER-WP-118', {
        rate: { amount: 2500, basis: 'day' },
        fuelIn: 3,
      }),
    ],
  }),
  log(15, 'HO-CM-14', 'working', 2330),
  checkout('s1', 14, 'K. Perera', 'Block A · Level 3 slab', ago(12), [
    { toolId: 'shovel', quantity: 6 },
    { toolId: 'mammoty', quantity: 4 },
    { toolId: 'wheelbarrow', quantity: 4 },
  ]),
  log(14, 'WP KA-4471', 'working', 4301),
  {
    kind: 'return',
    draft: {
      returnedOn: ago(12),
      owner: 'Lanka Plant Hire',
      reference: 'HA 5512',
      vehicleNo: 'WP LY-7765',
      returnedBy: STORE_KEEPER,
      machines: [{ regNo: 'LPH-RL-03', meterOut: 1730, fuelOut: 2, conditionOut: 'good' }],
      tools: [],
    },
  },
  checkIn('s1', 12, [
    { toolId: 'shovel', damaged: 0, missing: 1 },
    { toolId: 'mammoty', damaged: 0, missing: 0 },
    { toolId: 'wheelbarrow', damaged: 1, missing: 0 },
  ], 'Wheelbarrow tyre punctured; one shovel not returned'),
  log(11, 'LPH-EX-07', 'working', 9970),
  log(10, 'WP LH-9031', 'working', 184910),
  checkout('s2', 10, 'S. Fernando', 'Block A · Level 3 beams', inDays(4), [
    { toolId: 'steel-prop', quantity: 60 },
    { toolId: 'scaffold-frame', quantity: 24 },
  ]),
  receive(9, 'Ceylon Cranes', 'hired', 'CC 2291', {
    machines: [
      machine('Mobile crane', 'Tadano GR-250N · 25 t', 'WP LB-2208', {
        meterIn: 3315,
        rate: { amount: 9500, basis: 'hour' },
        operator: 'H. Abeywardena',
        dueBack: inDays(12),
      }),
    ],
  }, { hireOrder: 'HO 2026/058' }),
  { kind: 'extend', regNo: 'WP KA-4471', dueBack: inDays(2), date: ago(9), loggedBy: ENGINEER },
  log(8, 'WP LB-2208', 'working', 3322),
  log(7, 'WP KA-4471', 'working', 4362),
  checkout('s5', 7, 'N. Rathnayake', 'Block A · Level 1 finishes', ago(7), [
    { toolId: 'spirit-level', quantity: 2 },
    { toolId: 'laser-level', quantity: 1 },
  ]),
  checkIn('s5', 7, [
    { toolId: 'spirit-level', damaged: 0, missing: 0 },
    { toolId: 'laser-level', damaged: 0, missing: 0 },
  ]),
  log(6, 'LPH-EX-07', 'breakdown', 9988, 'Track tension lost - supplier’s fitter attending'),
  receive(6, 'Mahaweli Equipment Rentals', 'hired', 'DN 3512', {
    machines: [
      machine('Plate compactor', 'Mikasa MVC-88', 'MER-PC-52', {
        rate: { amount: 3500, basis: 'day' },
        dueBack: inDays(1),
      }),
    ],
    tools: [{ toolId: 'steel-prop', quantity: 40, dailyRate: 30 }],
  }, { vehicleNo: 'NW LF-2290' }),
  log(5, 'LPH-EX-07', 'working', 9990, 'Track repaired'),
  log(5, 'HO-GN-22', 'working', 7690),
  log(5, 'WP LB-2208', 'working', 3341),
  {
    kind: 'return',
    draft: {
      returnedOn: ago(4),
      owner: 'Mahaweli Equipment Rentals',
      reference: 'DN 3460',
      vehicleNo: 'NW LF-2290',
      returnedBy: STORE_KEEPER,
      remarks: 'Dewatering finished at Block B',
      machines: [{ regNo: 'MER-WP-118', fuelOut: 1, conditionOut: 'fair', damage: 'Impeller worn' }],
      tools: [{ toolId: 'scaffold-frame', quantity: 20, damaged: 0 }],
    },
  },
  receive(3, COMPANY_YARD, 'company', 'TN 0244', {
    tools: [
      { toolId: 'shovel', quantity: 10 },
      { toolId: 'harness', quantity: 6 },
    ],
  }),
  checkout('s3', 3, 'M. Jayasinghe', 'Block B · Level 1 walls', ago(1), [
    { toolId: 'trowel', quantity: 6 },
    { toolId: 'spirit-level', quantity: 2 },
    { toolId: 'measuring-tape', quantity: 1 },
  ]),
  log(2, 'WP KA-4471', 'working', 4398),
  log(2, 'WP LB-2208', 'idle', 3349, 'Waiting for Level 3 formwork'),
  log(2, 'WP LH-9031', 'working', 185480),
  checkout('s6', 2, 'L. Dias', 'Block A · Level 3 edge works', inDays(5), [
    { toolId: 'harness', quantity: 6 },
  ]),
  log(1, 'HO-CM-14', 'breakdown', 2384, 'Drum gearbox noisy - mechanic called'),
  log(1, 'LPH-EX-07', 'working', 10024),
  checkout('s4', 0, 'A. Silva', 'Block B · Ground floor services', ago(0), [
    { toolId: 'hammer-drill', quantity: 1 },
    { toolId: 'angle-grinder', quantity: 1 },
    { toolId: 'ladder', quantity: 1 },
  ]),
];
