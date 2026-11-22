import { useMemo, useState } from 'react';
import Icon from '../../../common/Icon/Icon';
import { WorkerAvatar, WorkerStatusBadge } from '../WorkerBadge/WorkerBadge';
import { inputClass } from '../../materials/formStyles';
import { getTrade, trades } from '../../../../constants/labor';
import { compareWorkers, workerCode } from '../../../../utils/labor';
import { formatDate } from '../../../../utils/materials';
import type { TradeId, WorkerSummary } from '../../../../types/labor';

/**
 * WorkforceList
 *
 * Everyone on the site register as a card: name, trade, where they stand
 * today and the job they're on. Released workers are listed underneath.
 */
type Filter = 'all' | 'assigned' | 'free' | 'off';

type WorkforceListProps = {
  workers: WorkerSummary[];
  onOpen: (workerId: string) => void;
};

function matches(s: WorkerSummary, q: string): boolean {
  if (!q) return true;
  const { worker } = s;
  return [
    worker.name,
    worker.callingName,
    worker.nic,
    worker.phone,
    workerCode(worker.workerNo),
    getTrade(worker.trade).label,
    s.assignment?.activity,
    s.assignment?.location,
  ]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

function inFilter(s: WorkerSummary, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'off') return s.status === 'absent' || s.status === 'leave';
  if (filter === 'assigned') return Boolean(s.assignment);
  return s.status === filter;
}

function WorkerCard({ summary, onOpen }: { summary: WorkerSummary; onOpen: () => void }) {
  const { worker, status, assignment } = summary;

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={`flex h-full w-full items-start gap-3 rounded-2xl border bg-white p-4 text-left transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
          status === 'free' ? 'border-amber-300 hover:border-amber-400' : 'border-gray-200 hover:border-blue-300'
        }`}
      >
        <WorkerAvatar name={worker.name} />
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              <span className="block truncate font-semibold text-gray-900">{worker.name}</span>
              <span className="block truncate text-sm text-gray-500">{getTrade(worker.trade).label}</span>
            </span>
            <WorkerStatusBadge status={status} />
          </span>
          <span className="mt-3 block truncate text-sm">
            {assignment ? (
              <>
                <span className="text-gray-900">{assignment.activity}</span>
                <span className="text-gray-400"> · {assignment.location}</span>
              </>
            ) : (
              <span className="text-gray-400">No work allocated</span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}

function WorkforceList({ workers, onOpen }: WorkforceListProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [trade, setTrade] = useState<TradeId | 'all'>('all');
  const [showReleased, setShowReleased] = useState(false);

  const active = workers.filter((w) => !w.worker.release);
  const q = query.trim().toLowerCase();

  const cards = useMemo(
    () =>
      workers
        .filter((w) => !w.worker.release)
        .filter((w) => trade === 'all' || w.worker.trade === trade)
        .filter((w) => inFilter(w, filter))
        .filter((w) => matches(w, q))
        .sort(compareWorkers),
    [workers, trade, filter, q],
  );

  const released = useMemo(
    () =>
      workers
        .filter((w) => w.worker.release)
        .filter((w) => matches(w, q))
        .sort((a, b) => (b.worker.release?.releasedOn ?? '').localeCompare(a.worker.release?.releasedOn ?? '')),
    [workers, q],
  );

  const tradesOnSite = trades.filter((t) => active.some((w) => w.worker.trade === t.id));

  const chips: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Everyone' },
    { id: 'assigned', label: 'On a job' },
    { id: 'free', label: 'Free' },
    { id: 'off', label: 'Absent or leave' },
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
                {active.filter((w) => inFilter(w, chip.id)).length}
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
              placeholder="Search name, NIC or job"
              aria-label="Search workers"
              className={`${inputClass} pl-9`}
            />
          </div>
          <select
            value={trade}
            onChange={(e) => setTrade(e.target.value as TradeId | 'all')}
            aria-label="Filter by trade"
            className={`${inputClass} sm:w-44`}
          >
            <option value="all">All trades</option>
            {tradesOnSite.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards */}
      {cards.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 px-5 py-14 text-center">
          <p className="font-medium text-gray-900">No workers match</p>
          <p className="mt-1 text-sm text-gray-500">Try a different search or filter.</p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((w) => (
            <WorkerCard key={w.worker.id} summary={w} onOpen={() => onOpen(w.worker.id)} />
          ))}
        </ul>
      )}

      {/* Released */}
      {released.length > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowReleased((prev) => !prev)}
            aria-expanded={showReleased}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Icon name="chevronDown" className={`h-4 w-4 transition-transform ${showReleased ? 'rotate-180' : ''}`} />
            {showReleased ? 'Hide' : 'Show'} {released.length} {released.length === 1 ? 'worker' : 'workers'} released
            from site
          </button>
          {showReleased && (
            <ul className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {released.map(({ worker }) => (
                <li key={worker.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(worker.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 sm:px-5"
                  >
                    <WorkerAvatar name={worker.name} size="sm" muted />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-700">{worker.name}</span>
                      <span className="block truncate text-xs text-gray-400">{getTrade(worker.trade).label}</span>
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">
                      Left {formatDate(worker.release?.releasedOn ?? '')}
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

export default WorkforceList;
