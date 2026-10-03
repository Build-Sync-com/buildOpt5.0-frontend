import { useCallback, useReducer } from 'react';
import { sampleEvents, sampleTools } from '../data/sampleMachinery';
import type { SampleEvent } from '../data/sampleMachinery';
import { daysOnSite, machineHireCost } from '../utils/machinery';
import { formatDate, newId, nextDocNo, todayISO } from '../utils/materials';
import type {
  CheckoutDraft,
  EquipmentReceipt,
  EquipmentReceiptDraft,
  EquipmentReturn,
  EquipmentReturnDraft,
  Machine,
  MachineLog,
  MachineLogDraft,
  MachineryState,
  Tool,
  ToolCheckIn,
  ToolCheckout,
  ToolLot,
} from '../types/machinery';

/**
 * useMachineryStore
 *
 * Machines and tools on site, and every receipt, return note, machine log
 * and tool slip. Receiving creates a machine per unit and a lot per tool
 * line; return notes close machines off and send lots back; tool slips lend
 * tools out until they're checked in.
 *
 * State lives in memory until the machinery API exists - swap the reducer's
 * callers for API calls then; the page only uses what this hook returns.
 */
const FIRST_ERN_NO = 410;
const FIRST_RTN_NO = 205;
const FIRST_SLIP_NO = 860;

type Action =
  | { type: 'addTool'; tool: Tool }
  | { type: 'receive'; id: string; machineIds: string[]; lotIds: string[]; draft: EquipmentReceiptDraft }
  | { type: 'log'; id: string; draft: MachineLogDraft }
  | { type: 'extend'; logId: string; machineId: string; dueBack: string; date: string; loggedBy: string }
  | { type: 'return'; id: string; draft: EquipmentReturnDraft }
  | { type: 'checkout'; id: string; draft: CheckoutDraft }
  | { type: 'checkIn'; checkoutId: string; checkIn: ToolCheckIn };

function currentStatus(state: MachineryState, machineId: string) {
  const latest = state.logs
    .filter((l) => l.machineId === machineId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.sequence - a.sequence)[0];
  return latest?.status ?? 'working';
}

function reducer(state: MachineryState, action: Action): MachineryState {
  switch (action.type) {
    case 'addTool':
      return { ...state, tools: [...state.tools, action.tool] };

    case 'receive': {
      const { draft } = action;
      const ernNo = nextDocNo(state.receipts.map((r) => r.ernNo), FIRST_ERN_NO);
      const { machines: machineDrafts, tools: toolDrafts, ...header } = draft;

      const machines: Machine[] = machineDrafts.map((m, i) => ({
        ...m,
        id: action.machineIds[i],
        receiptId: action.id,
        ernNo,
        owner: draft.owner,
        ownership: draft.ownership,
        arrivedOn: draft.receivedOn,
        rate: draft.ownership === 'hired' ? m.rate : undefined,
      }));
      const lots: ToolLot[] = toolDrafts.map((t, i) => ({
        ...t,
        id: action.lotIds[i],
        receiptId: action.id,
        ernNo,
        receivedOn: draft.receivedOn,
        owner: draft.owner,
        ownership: draft.ownership,
        dailyRate: draft.ownership === 'hired' ? t.dailyRate : undefined,
      }));
      const receipt: EquipmentReceipt = {
        ...header,
        id: action.id,
        ernNo,
        machineIds: machines.map((m) => m.id),
        lotIds: lots.map((l) => l.id),
      };

      return {
        ...state,
        receipts: [...state.receipts, receipt],
        machines: [...state.machines, ...machines],
        lots: [...state.lots, ...lots],
      };
    }

    case 'log': {
      const log: MachineLog = { ...action.draft, id: action.id, sequence: state.logs.length };
      return { ...state, logs: [...state.logs, log] };
    }

    case 'extend': {
      const machine = state.machines.find((m) => m.id === action.machineId);
      if (!machine) return state;
      const log: MachineLog = {
        id: action.logId,
        machineId: machine.id,
        date: action.date,
        status: currentStatus(state, machine.id),
        note: machine.dueBack
          ? `Off-hire moved from ${formatDate(machine.dueBack)} to ${formatDate(action.dueBack)}`
          : `Off-hire date set to ${formatDate(action.dueBack)}`,
        loggedBy: action.loggedBy,
        sequence: state.logs.length,
      };
      return {
        ...state,
        machines: state.machines.map((m) => (m.id === machine.id ? { ...m, dueBack: action.dueBack } : m)),
        logs: [...state.logs, log],
      };
    }

    case 'return': {
      const { draft } = action;
      const ret: EquipmentReturn = {
        ...draft,
        id: action.id,
        rtnNo: nextDocNo(state.returns.map((r) => r.rtnNo), FIRST_RTN_NO),
        machines: draft.machines.flatMap((line) => {
          const machine = state.machines.find((m) => m.id === line.machineId);
          if (!machine) return [];
          const readings = [
            machine.meterIn,
            line.meterOut,
            ...state.logs.filter((l) => l.machineId === machine.id).map((l) => l.meterReading),
          ].filter((v): v is number => v !== undefined);
          const latestMeter = readings.length ? Math.max(...readings) : undefined;
          return [
            {
              ...line,
              daysOnSite: daysOnSite(machine.arrivedOn, draft.returnedOn),
              hireCost: machineHireCost(machine, draft.returnedOn, latestMeter),
            },
          ];
        }),
      };
      if (ret.machines.length === 0 && ret.tools.length === 0) return state;
      return { ...state, returns: [...state.returns, ret] };
    }

    case 'checkout': {
      const checkout: ToolCheckout = {
        ...action.draft,
        id: action.id,
        slipNo: nextDocNo(state.checkouts.map((c) => c.slipNo), FIRST_SLIP_NO),
      };
      return { ...state, checkouts: [...state.checkouts, checkout] };
    }

    case 'checkIn':
      return {
        ...state,
        checkouts: state.checkouts.map((c) =>
          c.id === action.checkoutId && !c.checkIn ? { ...c, checkIn: action.checkIn } : c,
        ),
      };
  }
}

function receiveAction(draft: EquipmentReceiptDraft): Action {
  return {
    type: 'receive',
    id: newId(),
    machineIds: draft.machines.map(() => newId()),
    lotIds: draft.tools.map(() => newId()),
    draft,
  };
}

/* ---------------------------------------------------------------------------
 * Sample history - events name machines by registration and tool slips by a
 * tag, resolved to ids as the history replays.
 * ------------------------------------------------------------------------- */

function machineIdByReg(state: MachineryState, regNo: string): string {
  const returned = new Set(state.returns.flatMap((r) => r.machines.map((m) => m.machineId)));
  const machine = [...state.machines].reverse().find((m) => m.regNo === regNo && !returned.has(m.id));
  if (!machine) throw new Error(`Sample machine not on site: ${regNo}`);
  return machine.id;
}

/** Oldest lot of a tool from one owner that still has pieces to send back. */
function lotIdFor(state: MachineryState, toolId: string, owner: string): string {
  const sent = new Map<string, number>();
  state.returns.forEach((r) =>
    r.tools.forEach((t) => sent.set(t.lotId, (sent.get(t.lotId) ?? 0) + t.quantity)),
  );
  const lot = state.lots
    .filter((l) => l.toolId === toolId && l.owner === owner && l.quantity > (sent.get(l.id) ?? 0))
    .sort((a, b) => a.receivedOn.localeCompare(b.receivedOn))[0];
  if (!lot) throw new Error(`Sample lot not on site: ${toolId} from ${owner}`);
  return lot.id;
}

function replay(state: MachineryState, event: SampleEvent, slips: Map<string, string>): MachineryState {
  switch (event.kind) {
    case 'receive':
      return reducer(state, receiveAction(event.draft));
    case 'log':
      return reducer(state, {
        type: 'log',
        id: newId(),
        draft: { ...event.draft, machineId: machineIdByReg(state, event.regNo) },
      });
    case 'extend':
      return reducer(state, {
        type: 'extend',
        logId: newId(),
        machineId: machineIdByReg(state, event.regNo),
        dueBack: event.dueBack,
        date: event.date,
        loggedBy: event.loggedBy,
      });
    case 'return': {
      const { machines, tools, ...header } = event.draft;
      return reducer(state, {
        type: 'return',
        id: newId(),
        draft: {
          ...header,
          machines: machines.map(({ regNo, ...line }) => ({
            ...line,
            machineId: machineIdByReg(state, regNo),
          })),
          tools: tools.map((line) => ({
            ...line,
            lotId: lotIdFor(state, line.toolId, header.owner),
          })),
        },
      });
    }
    case 'checkout': {
      const id = newId();
      slips.set(event.tag, id);
      return reducer(state, { type: 'checkout', id, draft: event.draft });
    }
    case 'checkIn': {
      const checkoutId = slips.get(event.tag);
      if (!checkoutId) throw new Error(`Sample slip not found: ${event.tag}`);
      return reducer(state, { type: 'checkIn', checkoutId, checkIn: event.checkIn });
    }
  }
}

function createSampleState(): MachineryState {
  const empty: MachineryState = {
    machines: [],
    logs: [],
    tools: sampleTools,
    lots: [],
    receipts: [],
    returns: [],
    checkouts: [],
  };
  const slips = new Map<string, string>();
  return sampleEvents.reduce((state, event) => replay(state, event, slips), empty);
}

export function useMachineryStore() {
  const [state, dispatch] = useReducer(reducer, undefined, createSampleState);

  /** Add a tool to the list and return it with its new id. */
  const addTool = useCallback((draft: Omit<Tool, 'id'>): Tool => {
    const tool = { ...draft, id: newId() };
    dispatch({ type: 'addTool', tool });
    return tool;
  }, []);

  /** Record equipment arriving on site; returns the ERN number it'll get. */
  const receive = useCallback(
    (draft: EquipmentReceiptDraft): number => {
      dispatch(receiveAction(draft));
      return nextDocNo(state.receipts.map((r) => r.ernNo), FIRST_ERN_NO);
    },
    [state.receipts],
  );

  /** Log a machine's status and meter for the day. */
  const logMachine = useCallback((draft: MachineLogDraft) => {
    dispatch({ type: 'log', id: newId(), draft });
  }, []);

  /** Move a machine's off-hire date; the change is kept in its log. */
  const extendHire = useCallback((machineId: string, dueBack: string, loggedBy: string) => {
    dispatch({ type: 'extend', logId: newId(), machineId, dueBack, date: todayISO(), loggedBy });
  }, []);

  /** Send equipment back to its owner; returns the RTN number it'll get. */
  const sendBack = useCallback(
    (draft: EquipmentReturnDraft): number => {
      dispatch({ type: 'return', id: newId(), draft });
      return nextDocNo(state.returns.map((r) => r.rtnNo), FIRST_RTN_NO);
    },
    [state.returns],
  );

  /** Lend tools from the store; returns the tool slip number it'll get. */
  const checkout = useCallback(
    (draft: CheckoutDraft): number => {
      dispatch({ type: 'checkout', id: newId(), draft });
      return nextDocNo(state.checkouts.map((c) => c.slipNo), FIRST_SLIP_NO);
    },
    [state.checkouts],
  );

  /** Take a slip's tools back into the store and close it. */
  const checkIn = useCallback((checkoutId: string, draft: ToolCheckIn) => {
    dispatch({ type: 'checkIn', checkoutId, checkIn: draft });
  }, []);

  return { state, addTool, receive, logMachine, extendHire, sendBack, checkout, checkIn };
}
