import { DUE_SOON_DAYS, getMeterKind, rateBases } from '../constants/machinery';
import { daysBetween, formatCurrency, formatNumber, todayISO } from './materials';
import type {
  DueState,
  HireRate,
  Machine,
  MachineLog,
  MachineSummary,
  MachineryState,
  MeterKind,
  OpenLot,
  ToolCheckout,
  ToolStock,
} from '../types/machinery';

/**
 * Hire, meter and tool-count maths for machinery & equipment. Dates and
 * currency share the helpers in utils/materials.ts.
 */

/* ---------------------------------------------------------------------------
 * Formatting
 * ------------------------------------------------------------------------- */

/** "4,812 hrs", "61,204 km"; empty for machines with no meter. */
export function formatMeter(value: number, kind: MeterKind): string {
  const meter = getMeterKind(kind);
  return meter.short ? `${formatNumber(value, 1)} ${meter.short}` : formatNumber(value, 1);
}

/** "Rs. 18,000 / day". */
export function formatRate(rate: HireRate): string {
  const per = rateBases.find((b) => b.id === rate.basis)?.per ?? rate.basis;
  return `${formatCurrency(rate.amount)} / ${per}`;
}

/** "1 piece", "12 pieces" - tools are always counted. */
export function formatPieces(value: number): string {
  return `${formatNumber(value, 0)} ${value === 1 ? 'piece' : 'pieces'}`;
}

/** "Rs. 1.24M", "Rs. 86.5K" for stat tiles. */
export function compactRupees(value: number): string {
  if (value >= 1_000_000) return `Rs. ${formatNumber(value / 1_000_000, 2)}M`;
  if (value >= 1_000) return `Rs. ${formatNumber(value / 1_000, 1)}K`;
  return `Rs. ${formatNumber(value, 0)}`;
}

/* ---------------------------------------------------------------------------
 * Machines
 * ------------------------------------------------------------------------- */

/** Days on site counting the arrival day, so a same-day return is day 1. */
export function daysOnSite(arrivedOn: string, until: string): number {
  return Math.max(1, daysBetween(arrivedOn, until) + 1);
}

/** Meter units used: highest reading less the reading at arrival. */
export function meterUsage(machine: Machine, latestMeter?: number): number | undefined {
  if (machine.meter === 'none' || machine.meterIn === undefined || latestMeter === undefined) {
    return undefined;
  }
  return Math.max(0, latestMeter - machine.meterIn);
}

/**
 * Hire owed for a machine up to `until`. Day rates bill every calendar day
 * on site, month rates pro rata over 30 days, and hour rates by the hour
 * meter. Company-owned machines cost nothing here.
 */
export function machineHireCost(machine: Machine, until: string, latestMeter?: number): number {
  const { rate } = machine;
  if (machine.ownership !== 'hired' || !rate) return 0;
  const days = daysOnSite(machine.arrivedOn, until);
  if (rate.basis === 'day') return days * rate.amount;
  if (rate.basis === 'month') return Math.round((days / 30) * rate.amount);
  return Math.round((meterUsage(machine, latestMeter) ?? 0) * rate.amount);
}

export function dueState(dueBack: string, today = todayISO()): DueState {
  const days = daysBetween(today, dueBack);
  if (days < 0) return 'overdue';
  if (days <= DUE_SOON_DAYS) return 'soon';
  return 'ok';
}

/** Newest log first; same-day logs in reverse recording order. */
function compareLogsNewest(a: MachineLog, b: MachineLog): number {
  return b.date.localeCompare(a.date) || b.sequence - a.sequence;
}

/** Every machine with its status, meter, hire bill and off-hire state. */
export function summarizeMachines(state: MachineryState, today = todayISO()): MachineSummary[] {
  const returnByMachine = new Map(
    state.returns.flatMap((ret) =>
      ret.machines.map((line) => [
        line.machineId,
        { ...line, returnId: ret.id, rtnNo: ret.rtnNo, returnedOn: ret.returnedOn },
      ]),
    ),
  );

  return state.machines.map((machine) => {
    const logs = state.logs.filter((l) => l.machineId === machine.id).sort(compareLogsNewest);
    const returned = returnByMachine.get(machine.id);
    const readings = [
      machine.meterIn,
      ...logs.map((l) => l.meterReading),
      returned?.meterOut,
    ].filter((v): v is number => v !== undefined);
    const latestMeter = machine.meter !== 'none' && readings.length ? Math.max(...readings) : undefined;
    const until = returned?.returnedOn ?? today;
    const due = !returned && machine.dueBack ? dueState(machine.dueBack, today) : null;

    return {
      machine,
      status: returned ? 'returned' : (logs[0]?.status ?? 'working'),
      logs,
      latestMeter,
      usage: meterUsage(machine, latestMeter),
      daysOnSite: daysOnSite(machine.arrivedOn, until),
      hireCost: returned ? returned.hireCost : machineHireCost(machine, until, latestMeter),
      due,
      daysToDue: due && machine.dueBack ? daysBetween(today, machine.dueBack) : undefined,
      returned,
    };
  });
}

/* ---------------------------------------------------------------------------
 * Tools
 * ------------------------------------------------------------------------- */

/** Pieces of each lot already sent back to the owner. */
function returnedByLot(state: MachineryState): Map<string, number> {
  const sent = new Map<string, number>();
  state.returns.forEach((ret) =>
    ret.tools.forEach((line) => sent.set(line.lotId, (sent.get(line.lotId) ?? 0) + line.quantity)),
  );
  return sent;
}

/** Hire owed on one hired lot: each piece bills every day until it goes back. */
function lotHireCost(state: MachineryState, lotId: string, today: string): number {
  const lot = state.lots.find((l) => l.id === lotId);
  if (!lot?.dailyRate) return 0;
  let piecesLeft = lot.quantity;
  let pieceDays = 0;
  state.returns.forEach((ret) =>
    ret.tools
      .filter((line) => line.lotId === lotId)
      .forEach((line) => {
        pieceDays += line.quantity * daysOnSite(lot.receivedOn, ret.returnedOn);
        piecesLeft -= line.quantity;
      }),
  );
  pieceDays += piecesLeft * daysOnSite(lot.receivedOn, today);
  return pieceDays * lot.dailyRate;
}

export function isOpenCheckout(checkout: ToolCheckout): boolean {
  return !checkout.checkIn;
}

/** Overdue once the due-back date has passed and the slip is still open. */
export function checkoutOverdue(checkout: ToolCheckout, today = todayISO()): boolean {
  return isOpenCheckout(checkout) && checkout.dueBack < today;
}

/** Every tool with its counts, open lots, and who has pieces out. */
export function summarizeTools(state: MachineryState, today = todayISO()): ToolStock[] {
  const sent = returnedByLot(state);

  return state.tools.map((tool) => {
    const lots: OpenLot[] = state.lots
      .filter((lot) => lot.toolId === tool.id)
      .map((lot) => ({ ...lot, remaining: lot.quantity - (sent.get(lot.id) ?? 0) }))
      .sort((a, b) => a.receivedOn.localeCompare(b.receivedOn));

    let lost = 0;
    let damaged = 0;
    let out = 0;
    const holders: ToolStock['holders'] = [];

    state.checkouts.forEach((checkout) => {
      checkout.lines
        .filter((line) => line.toolId === tool.id)
        .forEach((line) => {
          if (!checkout.checkIn) {
            out += line.quantity;
            holders.push({ checkout, quantity: line.quantity });
          }
        });
      checkout.checkIn?.lines
        .filter((line) => line.toolId === tool.id)
        .forEach((line) => {
          lost += line.missing;
          damaged += line.damaged;
        });
    });
    state.returns.forEach((ret) =>
      ret.tools.filter((line) => line.toolId === tool.id).forEach((line) => (damaged -= line.damaged)),
    );

    const openLots = lots.filter((lot) => lot.remaining > 0);
    const onSite = Math.max(0, openLots.reduce((sum, lot) => sum + lot.remaining, 0) - lost);
    damaged = Math.max(0, damaged);

    return {
      tool,
      onSite,
      available: Math.max(0, onSite - out - damaged),
      out,
      damaged,
      lost,
      lots: openLots,
      holders: holders.sort((a, b) => a.checkout.checkedOutOn.localeCompare(b.checkout.checkedOutOn)),
      hireCost: openLots.reduce((sum, lot) => sum + lotHireCost(state, lot.id, today), 0),
    };
  });
}

/** Owners with anything still on site - the people a return note can go to. */
export function ownersOnSite(machines: MachineSummary[], tools: ToolStock[]): string[] {
  const owners = new Set<string>();
  machines.filter((m) => !m.returned).forEach((m) => owners.add(m.machine.owner));
  tools.forEach((t) => t.lots.forEach((lot) => owners.add(lot.owner)));
  return [...owners].sort((a, b) => a.localeCompare(b));
}
