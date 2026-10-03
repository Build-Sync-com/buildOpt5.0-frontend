import { useMemo, useState } from 'react';
import Icon from '../../../common/Icon/Icon';
import HireClock from '../HireClock/HireClock';
import { DueBadge, MachineStatusBadge } from '../StatusBadge/StatusBadge';
import { inputClass } from '../../materials/formStyles';
import { getMachineCategory, machineCategories } from '../../../../constants/machinery';
import { formatMeter, formatRate } from '../../../../utils/machinery';
import { formatCurrency, formatDate } from '../../../../utils/materials';
import type { MachineCategoryId, MachineSummary } from '../../../../types/machinery';

/**
 * FleetBoard
 *
 * Every machine on site as a card: what it is, its plate, what it's doing,
 * how far into its hire it is and what it has cost so far. Machines already
 * sent back are listed underneath.
 */
type Filter = 'all' | 'working' | 'idle' | 'breakdown' | 'due';

type FleetBoardProps = {
  machines: MachineSummary[];
  onOpen: (machineId: string) => void;
};

const categoryOrder = new Map(machineCategories.map((c, i) => [c.id, i]));

function matches(m: MachineSummary, q: string): boolean {
  if (!q) return true;
  const { machine } = m;
  return [machine.type, machine.model, machine.regNo, machine.operator, machine.owner]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

/** Registration styled like a number plate (regular sans, no monospace). */
export function RegPlate({ regNo }: { regNo: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs font-semibold tracking-wide whitespace-nowrap text-gray-700">
      {regNo}
    </span>
  );
}

function MachineCard({ summary, onOpen }: { summary: MachineSummary; onOpen: () => void }) {
  const { machine, status, usage, latestMeter } = summary;
  const category = getMachineCategory(machine.category);
  const latestNote = summary.logs[0]?.note;
  const showNote = (status === 'breakdown' || status === 'idle') && latestNote;

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={`group flex h-full w-full flex-col rounded-2xl border bg-white p-4 text-left transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none sm:p-5 ${
          status === 'breakdown' ? 'border-red-200 hover:border-red-300' : 'border-gray-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              status === 'breakdown' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
            }`}
          >
            <Icon name={category.icon} className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-gray-900">{machine.type}</span>
            <span className="block truncate text-sm text-gray-500">{machine.model}</span>
          </span>
          <MachineStatusBadge status={status} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <RegPlate regNo={machine.regNo} />
          <DueBadge due={summary.due} daysToDue={summary.daysToDue} />
        </div>

        {showNote && (
          <p
            className={`mt-3 flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
              status === 'breakdown' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
            }`}
          >
            <Icon name={status === 'breakdown' ? 'wrench' : 'info'} className="mt-px h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">{latestNote}</span>
          </p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="min-w-0">
            <dt className="text-xs text-gray-400">Operator</dt>
            <dd className="truncate text-gray-900">{machine.operator ?? 'None assigned'}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-gray-400">{machine.meter === 'km' ? 'Driven on site' : 'Used on site'}</dt>
            <dd className="truncate text-gray-900">
              {usage !== undefined ? (
                formatMeter(usage, machine.meter)
              ) : (
                <span className="text-gray-400">{machine.meter === 'none' ? 'No meter' : '-'}</span>
              )}
              {latestMeter !== undefined && (
                <span className="text-xs text-gray-400"> · at {formatMeter(latestMeter, machine.meter)}</span>
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-auto w-full pt-4">
          <HireClock arrivedOn={machine.arrivedOn} dueBack={machine.dueBack} />

          <div className="mt-4 flex items-end justify-between gap-3 border-t border-dashed border-gray-200 pt-3">
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium text-gray-700">{machine.owner}</span>
              <span className="block truncate text-xs text-gray-400">
                {machine.rate ? formatRate(machine.rate) : 'Company-owned'}
              </span>
            </span>
            {machine.ownership === 'hired' && (
              <span className="shrink-0 text-right">
                <span className="block text-sm font-semibold text-gray-900">{formatCurrency(summary.hireCost)}</span>
                <span className="block text-xs text-gray-400">day {summary.daysOnSite}</span>
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

function FleetBoard({ machines, onOpen }: FleetBoardProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MachineCategoryId | 'all'>('all');
  const [showReturned, setShowReturned] = useState(false);

  const onSite = machines.filter((m) => !m.returned);
  const count = (f: Filter) =>
    f === 'due' ? onSite.filter((m) => m.due === 'overdue' || m.due === 'soon').length : onSite.filter((m) => m.status === f).length;

  const q = query.trim().toLowerCase();
  const cards = useMemo(
    () =>
      machines
        .filter((m) => !m.returned)
        .filter((m) => category === 'all' || m.machine.category === category)
        .filter((m) => {
          if (filter === 'all') return true;
          if (filter === 'due') return m.due === 'overdue' || m.due === 'soon';
          return m.status === filter;
        })
        .filter((m) => matches(m, q))
        .sort(
          (a, b) =>
            (categoryOrder.get(a.machine.category) ?? 0) - (categoryOrder.get(b.machine.category) ?? 0) ||
            a.machine.type.localeCompare(b.machine.type),
        ),
    [machines, category, filter, q],
  );

  const returned = useMemo(
    () =>
      machines
        .filter((m) => m.returned)
        .filter((m) => matches(m, q))
        .sort((a, b) => (b.returned?.returnedOn ?? '').localeCompare(a.returned?.returnedOn ?? '')),
    [machines, q],
  );

  const chips: { id: Filter; label: string; count?: number }[] = [
    { id: 'all', label: 'All on site', count: onSite.length },
    { id: 'working', label: 'Working', count: count('working') },
    { id: 'idle', label: 'Idle', count: count('idle') },
    { id: 'breakdown', label: 'Breakdown', count: count('breakdown') },
    { id: 'due', label: 'Off-hire due', count: count('due') },
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
              <span
                className={`rounded-full px-1.5 text-xs ${
                  filter === chip.id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {chip.count}
              </span>
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
              placeholder="Search machine, plate or operator"
              aria-label="Search machines"
              className={`${inputClass} pl-9`}
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MachineCategoryId | 'all')}
            aria-label="Filter by category"
            className={`${inputClass} sm:w-48`}
          >
            <option value="all">All categories</option>
            {machineCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards */}
      {cards.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 px-5 py-14 text-center">
          <p className="font-medium text-gray-900">No machines match</p>
          <p className="mt-1 text-sm text-gray-500">Try a different search or filter.</p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((m) => (
            <MachineCard key={m.machine.id} summary={m} onOpen={() => onOpen(m.machine.id)} />
          ))}
        </ul>
      )}

      {/* Sent back */}
      {returned.length > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowReturned((prev) => !prev)}
            aria-expanded={showReturned}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Icon name="chevronDown" className={`h-4 w-4 transition-transform ${showReturned ? 'rotate-180' : ''}`} />
            {showReturned ? 'Hide' : 'Show'} {returned.length} {returned.length === 1 ? 'machine' : 'machines'} already
            sent back
          </button>
          {showReturned && (
            <ul className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {returned.map((m) => (
                <li key={m.machine.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(m.machine.id)}
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-gray-50 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] sm:px-5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-700">
                        {m.machine.type} <span className="font-normal text-gray-400">· {m.machine.model}</span>
                      </span>
                      <span className="block truncate text-xs text-gray-400">
                        {m.machine.regNo} · {m.machine.owner}
                      </span>
                    </span>
                    <span className="text-right text-xs text-gray-500 sm:text-left">
                      {m.daysOnSite} days on site
                      {m.machine.ownership === 'hired' && (
                        <span className="block font-semibold text-gray-700">{formatCurrency(m.hireCost)}</span>
                      )}
                    </span>
                    <span className="col-span-2 text-xs text-gray-400 sm:col-span-1 sm:text-right">
                      Sent back {formatDate(m.returned?.returnedOn ?? '')} · RTN {m.returned?.rtnNo}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default FleetBoard;
