import { useMemo, useState } from 'react';
import Icon from '../../../common/Icon/Icon';
import BatchBar from '../BatchBar/BatchBar';
import { StockBadge, UseByBadge } from '../StockBadge/StockBadge';
import { inputClass } from '../formStyles';
import { getCategoryLabel, materialCategories } from '../../../../constants/materials';
import { formatDayMonth, formatQuantity } from '../../../../utils/materials';
import type { MaterialCategoryId, MaterialStock } from '../../../../types/materials';

/**
 * StockList
 *
 * Every material on the list with stock on hand, its batches (oldest first)
 * and status. Filter by text, category, or what needs attention; pick a row
 * to open the material.
 */
type AttentionFilter = 'all' | 'reorder' | 'use-by';

type StockListProps = {
  stock: MaterialStock[];
  onOpen: (materialId: string) => void;
};

const categoryOrder = new Map(materialCategories.map((c, i) => [c.id, i]));

function StockList({ stock, onOpen }: StockListProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MaterialCategoryId | 'all'>('all');
  const [attention, setAttention] = useState<AttentionFilter>('all');

  const reorderCount = stock.filter((s) => s.status !== 'in-stock').length;
  const useByCount = stock.filter((s) => s.useBySoon || s.expired).length;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stock
      .filter((s) => category === 'all' || s.material.category === category)
      .filter((s) => {
        if (attention === 'reorder') return s.status !== 'in-stock';
        if (attention === 'use-by') return s.useBySoon || s.expired;
        return true;
      })
      .filter(
        (s) =>
          !q ||
          s.material.name.toLowerCase().includes(q) ||
          s.material.spec.toLowerCase().includes(q),
      )
      .sort(
        (a, b) =>
          (categoryOrder.get(a.material.category) ?? 0) -
            (categoryOrder.get(b.material.category) ?? 0) ||
          a.material.name.localeCompare(b.material.name),
      );
  }, [stock, query, category, attention]);

  const chips: { id: AttentionFilter; label: string; count?: number }[] = [
    { id: 'all', label: 'All materials' },
    { id: 'reorder', label: 'Needs reorder', count: reorderCount },
    { id: 'use-by', label: 'Use-by soon', count: useByCount },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setAttention(chip.id)}
              aria-pressed={attention === chip.id}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                attention === chip.id
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {chip.label}
              {chip.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    attention === chip.id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {chip.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-64">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search materials"
              aria-label="Search materials"
              className={`${inputClass} pl-9`}
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MaterialCategoryId | 'all')}
            aria-label="Filter by category"
            className={`${inputClass} sm:w-52`}
          >
            <option value="all">All categories</option>
            {materialCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.7fr)_7.5rem_1.25rem] gap-6 border-b border-gray-200 bg-gray-50 px-5 py-2.5 text-xs font-semibold text-gray-500 md:grid">
          <span>Material</span>
          <span>On hand</span>
          <span>Batches · oldest goes out first</span>
          <span>Status</span>
          <span />
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-medium text-gray-900">No materials match</p>
            <p className="mt-1 text-sm text-gray-500">Try a different search or filter.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map((s) => {
              const { material, openBatches } = s;
              const nextOut = openBatches[0];
              return (
                <li key={material.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(material.id)}
                    className="group grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 px-5 py-4 text-left transition-colors hover:bg-blue-50/40 focus-visible:bg-blue-50/60 focus-visible:outline-none md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.7fr)_7.5rem_1.25rem] md:items-center md:gap-6"
                  >
                    {/* Material */}
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-gray-900">
                        {material.name}
                      </span>
                      <span className="block truncate text-sm text-gray-500">{material.spec}</span>
                      <span className="mt-0.5 block text-xs text-gray-400">
                        {getCategoryLabel(material.category)}
                      </span>
                    </span>

                    {/* On hand - sits top-right on small screens */}
                    <span className="text-right md:text-left">
                      <span
                        className={`block font-semibold ${
                          s.status === 'out' ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {formatQuantity(s.onHand, material.unit)}
                      </span>
                      <span className="block text-xs text-gray-400">
                        Reorder at {formatQuantity(material.reorderLevel, material.unit)}
                      </span>
                    </span>

                    {/* Batches */}
                    <span className="col-span-2 min-w-0 md:col-span-1">
                      <BatchBar batches={openBatches} unit={material.unit} />
                      <span className="mt-1.5 block truncate text-xs text-gray-500">
                        {openBatches.length > 1 ? (
                          <>
                            {openBatches.length} batches
                            <span className="text-gray-300"> · </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              next out received {formatDayMonth(nextOut.receivedOn)}
                            </span>
                          </>
                        ) : nextOut ? (
                          `1 batch · received ${formatDayMonth(nextOut.receivedOn)}`
                        ) : (
                          'No batches in store'
                        )}
                      </span>
                    </span>

                    {/* Status */}
                    <span className="col-span-2 flex flex-wrap gap-1.5 md:col-span-1 md:flex-col md:items-start">
                      <StockBadge status={s.status} />
                      {s.expired ? (
                        <UseByBadge state="expired" />
                      ) : (
                        s.useBySoon && <UseByBadge state="soon" />
                      )}
                    </span>

                    <Icon
                      name="chevronRight"
                      className="hidden h-5 w-5 text-gray-300 transition-colors group-hover:text-blue-600 md:block"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-3 flex items-center gap-4 text-xs text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-amber-400" /> Next batch out
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-blue-600" /> Later batches
        </span>
      </p>
    </div>
  );
}

export default StockList;
