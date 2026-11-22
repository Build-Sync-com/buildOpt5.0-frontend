import type { IconName } from '../components/common/Icon/Icon';
import type { TradeId } from './labor';

/**
 * Task requests - domain types.
 *
 * From the program, an engineer asks for what a sub-task needs: labour,
 * materials, or machinery and equipment. Each request belongs to one
 * sub-task.
 *
 * A labour request asks for workers by trade ("3 masons, 2 helpers") for a
 * span of days. Whoever runs labour on site fills it by allocating workers.
 */

/**
 * Where a request stands. Never stored - it's worked out from what has been
 * done against the request: labour requests from the workers allocated to
 * them; materials and machinery requests stay "requested" until their pages
 * can fill them.
 */
export type RequestStatus = 'requested' | 'partly-filled' | 'filled';

export type LaborRequestLine = {
  trade: TradeId;
  workers: number;
};

export type LaborRequest = {
  id: string;
  /** Shown as LR-301. */
  requestNo: number;
  /** The sub-task it's for. */
  taskId: string;
  lines: LaborRequestLine[];
  neededFrom: string;
  neededTo: string;
  note?: string;
  requestedBy: string;
  requestedOn: string;
};

export type LaborRequestDraft = Omit<LaborRequest, 'id' | 'requestNo' | 'requestedOn'>;

/** How far one trade on a labour request has been filled. */
export type LaborFillLine = {
  trade: TradeId;
  requested: number;
  allocated: number;
};

export type LaborRequestFill = {
  lines: LaborFillLine[];
  /** Workers allocated against the request, of any trade. */
  workerIds: string[];
  status: RequestStatus;
};

/** A quantity of one store material, counted in the material's own unit. */
export type MaterialRequestLine = {
  materialId: string;
  quantity: number;
};

/**
 * A material request asks the store for materials from its catalog, needed
 * at a work area by a date. The store answers it with a material issue note
 * that quotes the request number (MaterialIssue.requestRef).
 */
export type MaterialRequest = {
  id: string;
  /** Shown as MR-501. */
  requestNo: number;
  /** The sub-task it's for. */
  taskId: string;
  lines: MaterialRequestLine[];
  neededBy: string;
  /** Where on site the store should send it, e.g. "Block A · Level 3". */
  deliverTo: string;
  note?: string;
  requestedBy: string;
  requestedOn: string;
};

export type MaterialRequestDraft = Omit<MaterialRequest, 'id' | 'requestNo' | 'requestedOn'>;

/** How much of one material on a request the store has issued. */
export type MaterialFillLine = {
  materialId: string;
  requested: number;
  issued: number;
};

export type MaterialRequestFill = {
  lines: MaterialFillLine[];
  /** Issue notes (MIN numbers) that quote the request. */
  issueNos: number[];
  status: RequestStatus;
};

/** Machines of one type, e.g. 1 backhoe loader with its operator. */
export type MachineRequestLine = {
  /** A machine type from the machinery list, e.g. "Backhoe loader". */
  machineType: string;
  units: number;
  /** Needs someone to drive it, not just the machine. */
  withOperator: boolean;
};

/** Pieces of one tool from the tool store. */
export type ToolRequestLine = {
  toolId: string;
  quantity: number;
};

/**
 * A machinery & equipment request asks for plant (from the fleet on site,
 * or to be hired) and tools from the tool store, for a span of days at a
 * work area. It holds machines, tools, or both.
 */
export type EquipmentRequest = {
  id: string;
  /** Shown as EQ-701. */
  requestNo: number;
  /** The sub-task it's for. */
  taskId: string;
  machines: MachineRequestLine[];
  tools: ToolRequestLine[];
  neededFrom: string;
  neededTo: string;
  /** Where on site, e.g. "Block A · Level 3". */
  workArea: string;
  note?: string;
  requestedBy: string;
  requestedOn: string;
};

export type EquipmentRequestDraft = Omit<EquipmentRequest, 'id' | 'requestNo' | 'requestedOn'>;

/** How many pieces of one tool on a request have gone out on slips. */
export type ToolFillLine = {
  toolId: string;
  requested: number;
  checkedOut: number;
};

/** How many machines of one type have been assigned to a request. */
export type MachineFillLine = {
  machineType: string;
  requested: number;
  withOperator: boolean;
  /** Machines of this type assigned against the request. */
  machineIds: string[];
};

/**
 * How far an equipment request has been filled: tools by checking them out
 * on tool slips, machines by assigning units from the fleet.
 */
export type EquipmentRequestFill = {
  tools: ToolFillLine[];
  machines: MachineFillLine[];
  /** Tool slips that quote the request. */
  slipNos: number[];
  hasMachines: boolean;
  status: RequestStatus;
};

/**
 * Any request, flattened for the incoming-request lists on the Labor,
 * Materials and Machinery pages.
 */
export type IncomingRequestItem = {
  id: string;
  /** "LR-301". */
  code: string;
  icon: IconName;
  taskName: string;
  /** Section and task above the sub-task. */
  path: string[];
  /** One entry per thing asked for, e.g. "3 × Mason". */
  lines: string[];
  neededFrom: string;
  /** For a span of days; omitted when it's a "needed by" date. */
  neededTo?: string;
  /** Where on site. */
  place?: string;
  note?: string;
  requestedBy: string;
  requestedOn: string;
  status: RequestStatus;
  /** What's been done against it so far, e.g. "Allocated: Nimal, Ruwan" or "Issued on MIN 1043". */
  progress?: string;
};
