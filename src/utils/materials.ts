import { USE_BY_WARNING_DAYS, getUnit } from '../constants/materials';
import type {
  Batch,
  BatchDraw,
  MaterialStock,
  MaterialStoreState,
  StockStatus,
  UnitId,
} from '../types/materials';

/**
 * Stock maths and formatting for the materials store.
 */

/* ---------------------------------------------------------------------------
 * Quantities
 * ------------------------------------------------------------------------- */

/** Trim floating-point noise (0.1 + 0.2) from stock quantities. */
export function roundQty(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function formatNumber(value: number, maxDecimals = 2): string {
  return value.toLocaleString('en-GB', { maximumFractionDigits: maxDecimals });
}

/** "40 bags", "1 bag", "3.5 cubes", "1,250 kg". */
export function formatQuantity(value: number, unitId: UnitId): string {
  const unit = getUnit(unitId);
  return `${formatNumber(value, unit.decimals)} ${value === 1 ? unit.label : unit.plural}`;
}

/** Unit word to sit after a quantity input. */
export function unitSuffix(unitId: UnitId): string {
  return getUnit(unitId).plural;
}

/** Whether `value` has no more decimals than the unit allows. */
export function fitsUnit(value: number, unitId: UnitId): boolean {
  const factor = 10 ** getUnit(unitId).decimals;
  return Math.abs(Math.round(value * factor) - value * factor) < 1e-6;
}

export function formatCurrency(value: number): string {
  return `Rs. ${value.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`;
}

/* ---------------------------------------------------------------------------
 * Dates — stored as local ISO dates (yyyy-mm-dd)
 * ------------------------------------------------------------------------- */

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000);
}

/** "15 Sep 2026". */
export function formatDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "15 Sep". */
export function formatDayMonth(iso: string): string {
  return parseISODate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** "Today", "Yesterday", "12 days ago". */
export function formatAgo(iso: string, today = todayISO()): string {
  const days = daysBetween(iso, today);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

/* ---------------------------------------------------------------------------
 * FIFO
 * ------------------------------------------------------------------------- */

/** Oldest delivery first; same-day deliveries in the order they were recorded. */
export function compareFifo(a: Batch, b: Batch): number {
  return a.receivedOn.localeCompare(b.receivedOn) || a.sequence - b.sequence;
}

/** A material's batches that still have stock, in the order they'll be issued. */
export function getOpenBatches(batches: Batch[], materialId: string): Batch[] {
  return batches
    .filter((batch) => batch.materialId === materialId && batch.quantityRemaining > 0)
    .sort(compareFifo);
}

export type FifoDraw = BatchDraw & {
  batch: Batch;
  /** What the batch will hold after this draw. */
  remainingAfter: number;
};

export type FifoAllocation = {
  draws: FifoDraw[];
  /** Quantity the open batches couldn't cover. */
  shortfall: number;
};

/**
 * Split `quantity` across open batches, oldest first. Pass the batches
 * already in FIFO order (see getOpenBatches).
 */
export function allocateFifo(openBatches: Batch[], quantity: number): FifoAllocation {
  const draws: FifoDraw[] = [];
  let left = roundQty(quantity);

  for (const batch of openBatches) {
    if (left <= 0) break;
    const take = roundQty(Math.min(batch.quantityRemaining, left));
    if (take <= 0) continue;
    draws.push({
      batchId: batch.id,
      quantity: take,
      batch,
      remainingAfter: roundQty(batch.quantityRemaining - take),
    });
    left = roundQty(left - take);
  }

  return { draws, shortfall: Math.max(0, left) };
}

/* ---------------------------------------------------------------------------
 * Stock summary
 * ------------------------------------------------------------------------- */

export function stockStatus(onHand: number, reorderLevel: number): StockStatus {
  if (onHand <= 0) return 'out';
  if (onHand <= reorderLevel) return 'low';
  return 'in-stock';
}

/** Current stock of every material, worked out from batches and movements. */
export function summarizeStock(state: MaterialStoreState, today = todayISO()): MaterialStock[] {
  const lastMovement = new Map<string, string>();
  const touch = (materialId: string, date: string) => {
    const prev = lastMovement.get(materialId);
    if (!prev || date > prev) lastMovement.set(materialId, date);
  };
  state.receipts.forEach((receipt) =>
    receipt.lines.forEach((line) => touch(line.materialId, receipt.receivedOn)),
  );
  state.issues.forEach((issue) =>
    issue.lines.forEach((line) => touch(line.materialId, issue.issuedOn)),
  );

  return state.materials.map((material) => {
    const openBatches = getOpenBatches(state.batches, material.id);
    const onHand = roundQty(openBatches.reduce((sum, b) => sum + b.quantityRemaining, 0));
    const value = openBatches.reduce((sum, b) => sum + b.quantityRemaining * b.unitCost, 0);
    const useByDays = openBatches
      .filter((b) => b.useBy)
      .map((b) => daysBetween(today, b.useBy as string));

    return {
      material,
      onHand,
      value,
      openBatches,
      status: stockStatus(onHand, material.reorderLevel),
      useBySoon: useByDays.some((days) => days >= 0 && days <= USE_BY_WARNING_DAYS),
      expired: useByDays.some((days) => days < 0),
      lastMovement: lastMovement.get(material.id),
    };
  });
}

/** Use-by state of one batch, for badges. */
export function getUseByState(batch: Batch, today = todayISO()): 'expired' | 'soon' | 'ok' | null {
  if (!batch.useBy) return null;
  const days = daysBetween(today, batch.useBy);
  if (days < 0) return 'expired';
  if (days <= USE_BY_WARNING_DAYS) return 'soon';
  return 'ok';
}

/** Next document number: one above the highest so far, or `start`. */
export function nextDocNo(existing: number[], start: number): number {
  return existing.length ? Math.max(...existing) + 1 : start;
}

export function newId(): string {
  return crypto.randomUUID();
}
