import { useMemo, useState } from 'react';
import Icon from '../../../common/Icon/Icon';
import AvailabilityBar from '../AvailabilityBar/AvailabilityBar';
import { inputClass } from '../../materials/formStyles';
import { availabilitySegments, getToolCategory, toolCategories } from '../../../../constants/machinery';
import type { ToolCategoryId, ToolStock } from '../../../../types/machinery';

/**
 * ToolList
 *
 * Every tool with how many are on site, how many are in the store, out with
 * workers or damaged, and who owns them. Pick a row to open the tool.
 */
type Filter = 'all' | 'out' | 'attention' | 'hired';

type ToolListProps = {
  tools: ToolStock[];
  onOpen: (toolId: string) => void;
};

const categoryOrder = new Map(toolCategories.map((c, i) => [c.id, i]));

export function ToolStatusBadge({ stock }: { stock: ToolStock }) {
  if (stock.onSite <= 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-gray-500">
        None on site
      </span>
    );
  }
  if (stock.available <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        None free
      </span>
    );
  }
  if (stock.damaged > 0 && stock.out === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        {stock.damaged} damaged
      </span>
    );
  }
  if (stock.out > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        {stock.out} out
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-gray-600">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
      All in store
    </span>
  );
}

function ToolList({ tools, onOpen }: ToolListProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ToolCategoryId | 'all'>('all');

  const isHired = (t: ToolStock) => t.lots.some((lot) => lot.ownership === 'hired');
  const needsAttention = (t: ToolStock) => t.damaged > 0 || t.lost > 0;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools
      .filter((t) => category === 'all' || t.tool.category === category)
      .filter((t) => {
        if (filter === 'out') return t.out > 0;
        if (filter === 'attention') return needsAttention(t);
        if (filter === 'hired') return isHired(t);
        return true;
      })
      .filter(
        (t) => !q || t.tool.name.toLowerCase().includes(q) || t.tool.spec.toLowerCase().includes(q),
      )
      .sort(
        (a, b) =>
          (categoryOrder.get(a.tool.category) ?? 0) - (categoryOrder.get(b.tool.category) ?? 0) ||
          a.tool.name.localeCompare(b.tool.name),
      );
  }, [tools, query, category, filter]);

  const chips: { id: Filter; label: string; count?: number }[] = [
    { id: 'all', label: 'All tools' },
    { id: 'out', label: 'Out now', count: tools.filter((t) => t.out > 0).length },
    { id: 'attention', label: 'Damaged or lost', count: tools.filter(needsAttention).length },
    { id: 'hired', label: 'Hired', count: tools.filter(isHired).length },
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
              onClick={() => setFilter(chip.id)}
              aria-pressed={filter === chip.id}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === chip.id
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {chip.label}
              {chip.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    filter === chip.id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
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
              placeholder="Search tools"
              aria-label="Search tools"
              className={`${inputClass} pl-9`}
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ToolCategoryId | 'all')}
            aria-label="Filter by category"
            className={`${inputClass} sm:w-52`}
          >
            <option value="all">All categories</option>
            {toolCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="hidden grid-cols-[minmax(0,2fr)_6rem_minmax(0,1.8fr)_7rem_1.25rem] gap-6 border-b border-gray-200 bg-gray-50 px-5 py-2.5 text-xs font-semibold text-gray-500 md:grid">
          <span>Tool</span>
          <span>On site</span>
          <span>Where they are</span>
          <span>Status</span>
          <span />
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-medium text-gray-900">No tools match</p>
            <p className="mt-1 text-sm text-gray-500">Try a different search or filter.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map((t) => {
              const { tool } = t;
              const category = getToolCategory(tool.category);
              const owners = [...new Set(t.lots.map((lot) => lot.owner))];
              const breakdown = [
                `${t.available} in store`,
                t.out && `${t.out} out`,
                t.damaged && `${t.damaged} damaged`,
                t.lost && `${t.lost} lost`,
              ].filter(Boolean);

              return (
                <li key={tool.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(tool.id)}
                    className="group grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 px-5 py-4 text-left transition-colors hover:bg-blue-50/40 focus-visible:bg-blue-50/60 focus-visible:outline-none md:grid-cols-[minmax(0,2fr)_6rem_minmax(0,1.8fr)_7rem_1.25rem] md:items-center md:gap-6"
                  >
                    <span className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 sm:flex">
                        <Icon name={category.icon} className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-gray-900">{tool.name}</span>
                        <span className="block truncate text-sm text-gray-500">{tool.spec}</span>
                        <span className="mt-0.5 block truncate text-xs text-gray-400">
                          {owners.length ? owners.join(', ') : category.label}
                        </span>
                      </span>
                    </span>

                    <span className="text-right md:text-left">
                      <span className="block text-lg leading-tight font-bold text-gray-900">{t.onSite}</span>
                      <span className="block text-xs text-gray-400">{t.onSite === 1 ? 'piece' : 'pieces'}</span>
                    </span>

                    <span className="col-span-2 min-w-0 md:col-span-1">
                      <AvailabilityBar stock={t} />
                      <span className="mt-1.5 block truncate text-xs text-gray-500">{breakdown.join(' · ')}</span>
                    </span>

                    <span className="col-span-2 flex md:col-span-1">
                      <ToolStatusBadge stock={t} />
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

      <p className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-400">
        {availabilitySegments.map((segment) => (
          <span key={segment.key} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-4 rounded-full ${segment.className}`} /> {segment.label}
          </span>
        ))}
      </p>
    </div>
  );
}

export default ToolList;
