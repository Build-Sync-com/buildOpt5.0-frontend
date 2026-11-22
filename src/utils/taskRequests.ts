import { trades } from '../constants/labor';
import { REQUEST_SOON_DAYS } from '../constants/taskRequests';
import { daysBetween, formatQuantity, roundQty, todayISO } from './materials';
import { taskPath } from './program';
import type { LaborState } from '../types/labor';
import type { MachineryState, Tool } from '../types/machinery';
import type { Material, MaterialStoreState } from '../types/materials';
import type { ProgramNode } from '../types/program';
import type {
  EquipmentRequest,
  EquipmentRequestFill,
  IncomingRequestItem,
  LaborRequest,
  LaborRequestFill,
  LaborRequestLine,
  MachineRequestLine,
  MaterialRequest,
  MaterialRequestFill,
  MaterialRequestLine,
  ToolRequestLine,
} from '../types/taskRequests';

/** "EQ-701". */
export function equipmentRequestCode(requestNo: number): string {
  return `EQ-${requestNo}`;
}

/** "1 × Backhoe loader · 4 × Shovel +1 more" - machines first, then tools. */
export function formatEquipmentLines(
  machines: MachineRequestLine[],
  tools: ToolRequestLine[],
  toolList: Tool[],
  max = 2,
): string {
  const named = [
    ...machines.map((m) => `${m.units} × ${m.machineType}`),
    ...tools.map((t) => `${t.quantity} × ${toolList.find((x) => x.id === t.toolId)?.name ?? 'unknown tool'}`),
  ];
  const shown = named.slice(0, max).join(' · ');
  return named.length > max ? `${shown} +${named.length - max} more` : shown;
}

/** "LR-301". */
export function laborRequestCode(requestNo: number): string {
  return `LR-${requestNo}`;
}

/** "MR-501". */
export function materialRequestCode(requestNo: number): string {
  return `MR-${requestNo}`;
}

/**
 * "40 bags Portland cement · 2 cubes River sand", listing at most `max`
 * materials and counting the rest: "… +2 more".
 */
export function formatMaterialLines(lines: MaterialRequestLine[], materials: Material[], max = 2): string {
  const named = lines.map((l) => {
    const m = materials.find((x) => x.id === l.materialId);
    return m ? `${formatQuantity(l.quantity, m.unit)} ${m.name}` : `${l.quantity} × unknown material`;
  });
  const shown = named.slice(0, max).join(' · ');
  return named.length > max ? `${shown} +${named.length - max} more` : shown;
}

/** "3 masons · 1 helper", in the usual trade order. */
export function formatLaborLines(lines: LaborRequestLine[]): string {
  return trades
    .map((t) => {
      const n = lines.filter((l) => l.trade === t.id).reduce((sum, l) => sum + l.workers, 0);
      return n ? `${n} ${n === 1 ? t.label.toLowerCase() : t.plural}` : null;
    })
    .filter(Boolean)
    .join(' · ');
}

/* ---------------------------------------------------------------------------
 * One line per item, for the incoming-request lists
 * ------------------------------------------------------------------------- */

/** ["3 × Mason", "2 × Helper"]. */
export function laborLineLabels(lines: LaborRequestLine[]): string[] {
  return trades
    .map((t) => {
      const n = lines.filter((l) => l.trade === t.id).reduce((sum, l) => sum + l.workers, 0);
      return n ? `${n} × ${t.label}` : null;
    })
    .filter((s): s is string => Boolean(s));
}

/** ["40 bags · Portland cement", "2 cubes · River sand"]. */
export function materialLineLabels(lines: MaterialRequestLine[], materials: Material[]): string[] {
  return lines.map((l) => {
    const m = materials.find((x) => x.id === l.materialId);
    return m ? `${formatQuantity(l.quantity, m.unit)} · ${m.name}` : `${l.quantity} × unknown material`;
  });
}

/** ["1 × Backhoe loader · with operator", "4 × Shovel"]. */
export function equipmentLineLabels(machines: MachineRequestLine[], tools: ToolRequestLine[], toolList: Tool[]): string[] {
  return [
    ...machines.map((m) => `${m.units} × ${m.machineType}${m.withOperator ? ' · with operator' : ''}`),
    ...tools.map((t) => `${t.quantity} × ${toolList.find((x) => x.id === t.toolId)?.name ?? 'unknown tool'}`),
  ];
}

export function totalWorkers(lines: LaborRequestLine[]): number {
  return lines.reduce((sum, l) => sum + l.workers, 0);
}

/* ---------------------------------------------------------------------------
 * Incoming-request items - each kind flattened for the shared list
 * ------------------------------------------------------------------------- */

function taskInfo(byId: Map<string, ProgramNode>, taskId: string) {
  const task = byId.get(taskId);
  return { taskName: task?.name ?? 'Sub-task no longer in the program', path: task ? taskPath(byId, task) : [] };
}

/**
 * How far a labour request has been filled: for each requested trade, how
 * many workers of that trade have been allocated against it (each worker
 * counted once, even if moved off later - they were provided).
 */
export function laborRequestFill(request: LaborRequest, labor: LaborState): LaborRequestFill {
  const workerIds = [
    ...new Set(labor.assignments.filter((a) => a.requestId === request.id).map((a) => a.workerId)),
  ];
  const tradeOf = new Map(labor.workers.map((w) => [w.id, w.trade]));
  const lines = request.lines.map((l) => ({
    trade: l.trade,
    requested: l.workers,
    allocated: workerIds.filter((id) => tradeOf.get(id) === l.trade).length,
  }));
  const status = lines.every((l) => l.allocated >= l.requested)
    ? 'filled'
    : workerIds.length > 0
      ? 'partly-filled'
      : 'requested';
  return { lines, workerIds, status };
}

export function laborRequestItems(
  requests: LaborRequest[],
  byId: Map<string, ProgramNode>,
  labor: LaborState,
): IncomingRequestItem[] {
  const nameOf = new Map(labor.workers.map((w) => [w.id, w.callingName ?? w.name]));
  return requests.map((r) => {
    const fill = laborRequestFill(r, labor);
    return {
      id: r.id,
      code: laborRequestCode(r.requestNo),
      icon: 'users',
      ...taskInfo(byId, r.taskId),
      // "3 × Mason · 2 allocated"
      lines: fill.lines.map((l) => {
        const label = laborLineLabels([{ trade: l.trade, workers: l.requested }])[0];
        return l.allocated ? `${label} · ${l.allocated} allocated` : label;
      }),
      neededFrom: r.neededFrom,
      neededTo: r.neededTo,
      note: r.note,
      requestedBy: r.requestedBy,
      requestedOn: r.requestedOn,
      status: fill.status,
      progress: fill.workerIds.length
        ? `Allocated: ${fill.workerIds.map((id) => nameOf.get(id) ?? 'Unknown worker').join(', ')}`
        : undefined,
    };
  });
}

/** "MR-501", "MR 501", "mr501" all match - request numbers are typed by hand on issue notes. */
export function sameRequestRef(a: string | undefined, b: string): boolean {
  const clean = (ref: string) => ref.replace(/[\s\-_/.#]/g, '').toUpperCase();
  return Boolean(a) && clean(a as string) === clean(b);
}

/**
 * How far a material request has been issued: for each requested material,
 * the total the store has issued on notes quoting the request number.
 */
export function materialRequestFill(request: MaterialRequest, store: MaterialStoreState): MaterialRequestFill {
  const code = materialRequestCode(request.requestNo);
  const issues = store.issues.filter((i) => sameRequestRef(i.requestRef, code));
  const lines = request.lines.map((l) => ({
    materialId: l.materialId,
    requested: l.quantity,
    issued: roundQty(
      issues.reduce(
        (sum, i) => sum + i.lines.filter((x) => x.materialId === l.materialId).reduce((s, x) => s + x.quantity, 0),
        0,
      ),
    ),
  }));
  const status = lines.every((l) => l.issued >= l.requested)
    ? 'filled'
    : lines.some((l) => l.issued > 0)
      ? 'partly-filled'
      : 'requested';
  return { lines, issueNos: issues.map((i) => i.issueNo).sort((a, b) => a - b), status };
}

export function materialRequestItems(
  requests: MaterialRequest[],
  byId: Map<string, ProgramNode>,
  store: MaterialStoreState,
): IncomingRequestItem[] {
  return requests.map((r) => {
    const fill = materialRequestFill(r, store);
    return {
      id: r.id,
      code: materialRequestCode(r.requestNo),
      icon: 'package',
      ...taskInfo(byId, r.taskId),
      // "40 bags · Portland cement · 25 bags issued"
      lines: fill.lines.map((l) => {
        const label = materialLineLabels([{ materialId: l.materialId, quantity: l.requested }], store.materials)[0];
        const unit = store.materials.find((m) => m.id === l.materialId)?.unit;
        return l.issued > 0 && unit ? `${label} · ${formatQuantity(l.issued, unit)} issued` : label;
      }),
      neededFrom: r.neededBy,
      place: r.deliverTo,
      note: r.note,
      requestedBy: r.requestedBy,
      requestedOn: r.requestedOn,
      status: fill.status,
      progress: fill.issueNos.length ? `Issued on ${fill.issueNos.map((n) => `MIN ${n}`).join(', ')}` : undefined,
    };
  });
}

/**
 * How far an equipment request has been filled: for each requested tool,
 * the pieces checked out on slips quoting the request number (counted even
 * after they come back - they were provided); for each requested machine
 * type, the machines of that type assigned to the request.
 */
export function equipmentRequestFill(request: EquipmentRequest, machinery: MachineryState): EquipmentRequestFill {
  const code = equipmentRequestCode(request.requestNo);
  const slips = machinery.checkouts.filter((c) => sameRequestRef(c.requestRef, code));
  const tools = request.tools.map((t) => ({
    toolId: t.toolId,
    requested: t.quantity,
    checkedOut: slips.reduce(
      (sum, c) => sum + c.lines.filter((l) => l.toolId === t.toolId).reduce((s, l) => s + l.quantity, 0),
      0,
    ),
  }));

  const assignedIds = [
    ...new Set(machinery.assignments.filter((a) => sameRequestRef(a.requestRef, code)).map((a) => a.machineId)),
  ];
  const typeOf = new Map(machinery.machines.map((m) => [m.id, m.type]));
  const machines = request.machines.map((m) => ({
    machineType: m.machineType,
    requested: m.units,
    withOperator: m.withOperator,
    machineIds: assignedIds.filter((id) => typeOf.get(id) === m.machineType),
  }));

  const done =
    tools.every((t) => t.checkedOut >= t.requested) && machines.every((m) => m.machineIds.length >= m.requested);
  const started = tools.some((t) => t.checkedOut > 0) || machines.some((m) => m.machineIds.length > 0);
  return {
    tools,
    machines,
    slipNos: slips.map((c) => c.slipNo).sort((a, b) => a - b),
    hasMachines: machines.length > 0,
    status: done ? 'filled' : started ? 'partly-filled' : 'requested',
  };
}

export function equipmentRequestItems(
  requests: EquipmentRequest[],
  byId: Map<string, ProgramNode>,
  machinery: MachineryState,
): IncomingRequestItem[] {
  const regOf = new Map(machinery.machines.map((m) => [m.id, m.regNo]));
  return requests.map((r) => {
    const fill = equipmentRequestFill(r, machinery);
    // "1 × Backhoe loader · with operator · CAB-4521 assigned"
    const machineLabels = fill.machines.map((m) => {
      const label = equipmentLineLabels(
        [{ machineType: m.machineType, units: m.requested, withOperator: m.withOperator }],
        [],
        machinery.tools,
      )[0];
      const regs = m.machineIds.map((id) => regOf.get(id) ?? '?');
      return regs.length ? `${label} · ${regs.join(', ')} assigned` : label;
    });
    // "4 × Shovel · 4 checked out"
    const toolLabels = fill.tools.map((t) => {
      const label = equipmentLineLabels([], [{ toolId: t.toolId, quantity: t.requested }], machinery.tools)[0];
      return t.checkedOut > 0 ? `${label} · ${t.checkedOut} checked out` : label;
    });
    const assigned = fill.machines.reduce((sum, m) => sum + m.machineIds.length, 0);
    const progress = [
      assigned && `${assigned} ${assigned === 1 ? 'machine' : 'machines'} assigned`,
      fill.slipNos.length && `tools on ${fill.slipNos.length === 1 ? 'slip' : 'slips'} ${fill.slipNos.join(', ')}`,
    ].filter(Boolean) as string[];
    return {
      id: r.id,
      code: equipmentRequestCode(r.requestNo),
      icon: 'cog',
      ...taskInfo(byId, r.taskId),
      lines: [...machineLabels, ...toolLabels],
      neededFrom: r.neededFrom,
      neededTo: r.neededTo,
      place: r.workArea,
      note: r.note,
      requestedBy: r.requestedBy,
      requestedOn: r.requestedOn,
      status: fill.status,
      progress: progress.length ? progress.join(' · ').replace(/^./, (c) => c.toUpperCase()) : undefined,
    };
  });
}

/** Whether any open request is needed today, soon, or already - for tab badges. */
export function hasUrgentRequest(items: IncomingRequestItem[], today = todayISO()): boolean {
  return items.some((i) => i.status !== 'filled' && daysBetween(today, i.neededFrom) <= REQUEST_SOON_DAYS);
}

export const requestStatusLabels: Record<IncomingRequestItem['status'], string> = {
  requested: 'Requested',
  'partly-filled': 'Partly filled',
  filled: 'Filled',
};
