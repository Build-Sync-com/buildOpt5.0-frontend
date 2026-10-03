import Icon from '../../../common/Icon/Icon';
import type { IconName } from '../../../common/Icon/Icon';
import { compareFifo, formatDayMonth, formatNumber } from '../../../../utils/materials';
import type { MaterialStock } from '../../../../types/materials';

/**
 * MaterialsStats
 *
 * Four headline tiles for the store: what's in stock, what needs
 * reordering, open batches and the value of stock on hand.
 */
type Stat = {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  /** Amber icon to pull the eye — used when something needs action. */
  alert?: boolean;
};

function compactRupees(value: number): string {
  if (value >= 1_000_000) return `Rs. ${formatNumber(value / 1_000_000, 2)}M`;
  if (value >= 1_000) return `Rs. ${formatNumber(value / 1_000, 1)}K`;
  return `Rs. ${formatNumber(value, 0)}`;
}

function MaterialsStats({ stock }: { stock: MaterialStock[] }) {
  const inStock = stock.filter((s) => s.onHand > 0).length;
  const out = stock.filter((s) => s.status === 'out').length;
  const needReorder = stock.filter((s) => s.status !== 'in-stock').length;
  const openBatches = stock.flatMap((s) => s.openBatches).sort(compareFifo);
  const value = stock.reduce((sum, s) => sum + s.value, 0);

  const stats: Stat[] = [
    {
      label: 'Materials in stock',
      value: String(inStock),
      note: `of ${stock.length} on the materials list`,
      icon: 'package',
    },
    {
      label: 'Need reordering',
      value: String(needReorder),
      note: out ? `${out} out of stock` : 'At or below reorder level',
      icon: 'triangleAlert',
      alert: needReorder > 0,
    },
    {
      label: 'Open batches',
      value: String(openBatches.length),
      note: openBatches.length
        ? `Oldest received ${formatDayMonth(openBatches[0].receivedOn)}`
        : 'Nothing in store',
      icon: 'layers',
    },
    {
      label: 'Stock value',
      value: compactRupees(value),
      note: 'At received prices',
      icon: 'banknote',
    },
  ];

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 sm:text-sm">{stat.label}</span>
            <span
              className={`hidden h-9 w-9 shrink-0 items-center sm:flex justify-center rounded-lg ${
                stat.alert ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'
              }`}
            >
              <Icon name={stat.icon} className="h-[18px] w-[18px]" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{stat.value}</p>
          <p className="mt-2 text-xs text-gray-400">{stat.note}</p>
        </div>
      ))}
    </div>
  );
}

export default MaterialsStats;
