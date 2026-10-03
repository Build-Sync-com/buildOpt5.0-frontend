import type { StockStatus } from '../../../../types/materials';

/**
 * StockBadge / UseByBadge
 *
 * Small status pills for stock level and use-by dates.
 */
const statusStyles: Record<StockStatus, { label: string; className: string; dot: string }> = {
  'in-stock': { label: 'In stock', className: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  low: { label: 'Reorder', className: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
  out: { label: 'Out of stock', className: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};

export function StockBadge({ status }: { status: StockStatus }) {
  const style = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${style.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

export function UseByBadge({ state }: { state: 'expired' | 'soon' }) {
  return state === 'expired' ? (
    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-red-700">
      Past use-by
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-orange-700">
      Use by soon
    </span>
  );
}
