/**
 * Machinery & equipment - domain types.
 *
 * Two kinds of equipment reach site, and they're tracked differently:
 *
 * - Machines (backhoes, rollers, generators…) are tracked one unit at a time.
 *   Each arrival records who owns it, the hire rate, the meter reading, fuel
 *   and condition; a daily log tracks whether it's working, idle or broken
 *   down; and it leaves site on a return note that snapshots the hire bill.
 * - Tools (hammers, shovels, props…) are counted. Each delivery line becomes
 *   a lot from one owner; tools are lent to workers on tool slips, checked
 *   back in at the end of the job, and lots are sent back to their owner.
 *
 * Arrivals of both kinds share one equipment received note (ERN); departures
 * share one return note (RTN).
 */

export type MachineCategoryId =
  | 'earthmoving'
  | 'lifting'
  | 'compaction'
  | 'concrete'
  | 'power'
  | 'transport';

export type ToolCategoryId = 'hand' | 'power-tools' | 'measuring' | 'access' | 'safety' | 'site';

/** Hired from a plant hire company, or sent from the company's own yard. */
export type Ownership = 'hired' | 'company';

export type RateBasis = 'hour' | 'day' | 'month';

export type HireRate = {
  /** Rupees per `basis`. */
  amount: number;
  basis: RateBasis;
};

/** What the machine's meter counts; small plant often has none. */
export type MeterKind = 'hours' | 'km' | 'none';

/** Fuel tank in quarters: 0 empty … 4 full. */
export type FuelLevel = 0 | 1 | 2 | 3 | 4;

export type Condition = 'good' | 'fair' | 'poor';

export type MachineStatus = 'working' | 'idle' | 'breakdown';

export type ArrivalCheckId = 'documents' | 'operator' | 'safety' | 'leaks' | 'guards';

/** One machine's stay on site, from arrival until it's sent back. */
export type Machine = {
  id: string;
  receiptId: string;
  ernNo: number;
  /** What it is, e.g. "Backhoe loader". */
  type: string;
  category: MachineCategoryId;
  /** Make and model, e.g. "JCB 3CX". */
  model: string;
  /** Number plate or the owner's fleet number. */
  regNo: string;
  serialNo?: string;
  owner: string;
  ownership: Ownership;
  /** Only for hired machines. */
  rate?: HireRate;
  meter: MeterKind;
  meterIn?: number;
  fuelIn: FuelLevel;
  conditionIn: Condition;
  /** Arrival checks that passed. */
  checks: ArrivalCheckId[];
  operator?: string;
  /** ISO date (yyyy-mm-dd). */
  arrivedOn: string;
  /** Agreed off-hire date, if there is one. */
  dueBack?: string;
  remarks?: string;
};

/** A daily log line: what the machine was doing, and its meter. */
export type MachineLog = {
  id: string;
  machineId: string;
  date: string;
  status: MachineStatus;
  meterReading?: number;
  note?: string;
  loggedBy: string;
  /** Recording order, breaks ties between same-day logs. */
  sequence: number;
};

/** A tool the site keeps, independent of who owns any particular piece. */
export type Tool = {
  id: string;
  name: string;
  /** Size or rating, e.g. "Round mouth · fibreglass handle". */
  spec: string;
  category: ToolCategoryId;
  /** Where it's kept when it's in the store. */
  location: string;
};

/** Tools of one kind from one delivery line, sent back to the same owner. */
export type ToolLot = {
  id: string;
  toolId: string;
  receiptId: string;
  ernNo: number;
  receivedOn: string;
  owner: string;
  ownership: Ownership;
  quantity: number;
  /** Hire in rupees per piece per day, for hired lots. */
  dailyRate?: number;
  remarks?: string;
};

/** An equipment received note - one delivery, machines and/or tools. */
export type EquipmentReceipt = {
  id: string;
  ernNo: number;
  receivedOn: string;
  owner: string;
  ownership: Ownership;
  /** Delivery note, hire agreement or transfer note number. */
  reference: string;
  vehicleNo?: string;
  /** Hire order or PO number. */
  hireOrder?: string;
  receivedBy: string;
  machineIds: string[];
  lotIds: string[];
};

export type MachineReturnLine = {
  machineId: string;
  meterOut?: number;
  fuelOut: FuelLevel;
  conditionOut: Condition;
  damage?: string;
  /** Snapshot when it left: days on site and hire owed. */
  daysOnSite: number;
  hireCost: number;
};

export type ToolReturnLine = {
  lotId: string;
  toolId: string;
  quantity: number;
  /** How many of `quantity` went back damaged. */
  damaged: number;
};

/** A return note - equipment leaving site, back to one owner. */
export type EquipmentReturn = {
  id: string;
  rtnNo: number;
  returnedOn: string;
  owner: string;
  reference?: string;
  vehicleNo?: string;
  remarks?: string;
  returnedBy: string;
  machines: MachineReturnLine[];
  tools: ToolReturnLine[];
};

export type CheckoutLine = {
  toolId: string;
  quantity: number;
};

export type CheckInLine = {
  toolId: string;
  /** Came back but needs repair - stays out of use. */
  damaged: number;
  /** Didn't come back - written off. */
  missing: number;
};

export type ToolCheckIn = {
  returnedOn: string;
  receivedBy: string;
  note?: string;
  lines: CheckInLine[];
};

/** A tool slip - tools lent from the store to a worker or gang. */
export type ToolCheckout = {
  id: string;
  slipNo: number;
  checkedOutOn: string;
  issuedTo: string;
  workArea: string;
  /** Date the tools should be back in the store. */
  dueBack: string;
  issuedBy: string;
  lines: CheckoutLine[];
  /** Set once the tools come back; closes the slip. */
  checkIn?: ToolCheckIn;
};

/* ---------------------------------------------------------------------------
 * Drafts - what the forms hand over, before ids and numbers exist
 * ------------------------------------------------------------------------- */

export type MachineDraft = Omit<
  Machine,
  'id' | 'receiptId' | 'ernNo' | 'owner' | 'ownership' | 'arrivedOn'
>;

export type ToolLotDraft = Pick<ToolLot, 'toolId' | 'quantity' | 'dailyRate' | 'remarks'>;

export type EquipmentReceiptDraft = Omit<
  EquipmentReceipt,
  'id' | 'ernNo' | 'machineIds' | 'lotIds'
> & {
  machines: MachineDraft[];
  tools: ToolLotDraft[];
};

export type EquipmentReturnDraft = Omit<EquipmentReturn, 'id' | 'rtnNo' | 'machines'> & {
  machines: Omit<MachineReturnLine, 'daysOnSite' | 'hireCost'>[];
};

export type MachineLogDraft = Omit<MachineLog, 'id' | 'sequence'>;

export type CheckoutDraft = Omit<ToolCheckout, 'id' | 'slipNo' | 'checkIn'>;

export type MachineryState = {
  machines: Machine[];
  logs: MachineLog[];
  tools: Tool[];
  lots: ToolLot[];
  receipts: EquipmentReceipt[];
  returns: EquipmentReturn[];
  checkouts: ToolCheckout[];
};

/* ---------------------------------------------------------------------------
 * Summaries - worked out from the state for the page
 * ------------------------------------------------------------------------- */

export type DueState = 'overdue' | 'soon' | 'ok';

export type MachineSummary = {
  machine: Machine;
  status: MachineStatus | 'returned';
  /** Newest first. */
  logs: MachineLog[];
  /** Highest meter reading known. */
  latestMeter?: number;
  /** Meter units used on site so far. */
  usage?: number;
  daysOnSite: number;
  /** Hire owed so far (or in full, once returned). */
  hireCost: number;
  /** Against `dueBack`, while on site. */
  due: DueState | null;
  daysToDue?: number;
  returned?: MachineReturnLine & { returnId: string; rtnNo: number; returnedOn: string };
};

export type OpenLot = ToolLot & {
  /** Not yet sent back to the owner. */
  remaining: number;
};

export type ToolHolder = {
  checkout: ToolCheckout;
  quantity: number;
};

export type ToolStock = {
  tool: Tool;
  /** Pieces on site: received, less sent back and written off. */
  onSite: number;
  /** In the store and fit to lend. */
  available: number;
  out: number;
  damaged: number;
  lost: number;
  /** Lots with pieces still to send back, oldest first. */
  lots: OpenLot[];
  holders: ToolHolder[];
  /** Hire owed so far on its hired lots still on site. */
  hireCost: number;
};
