import type { ReactNode } from 'react';
import Icon from '../../../common/Icon/Icon';
import { REQUEST_SOON_DAYS } from '../../../../constants/taskRequests';
import { daysBetween, formatDate, formatDayMonth, todayISO } from '../../../../utils/materials';
import { requestStatusLabels } from '../../../../utils/taskRequests';
import type { IncomingRequestItem, RequestStatus } from '../../../../types/taskRequests';

/**
 * IncomingRequests
 *
 * Requests raised from the program (Tasks page) for one kind of resource,
 * as cards: which sub-task they're for, what's asked for, when and where,
 * who asked, and how far it's been filled. Open requests come first,
 * soonest-needed first, flagged when they're needed today or within the
 * next couple of days; filled ones sink to the bottom. The Labor, Materials
 * and Machinery pages each pass their own kind, and can add actions to each
 * card (e.g. "Allocate workers").
 */

type IncomingRequestsProps = {
  items: IncomingRequestItem[];
  emptyTitle: string;
  emptyText: string;
  /** Buttons for one card, shown at its foot. */
  renderActions?: (item: IncomingRequestItem) => ReactNode;
};

const statusStyles: Record<RequestStatus, string> = {
  requested: 'bg-amber-100 text-amber-800',
  'partly-filled': 'bg-blue-50 text-blue-700',
  filled: 'bg-gray-100 text-gray-600',
};

function urgency(item: IncomingRequestItem, today: string) {
  const days = daysBetween(today, item.neededFrom);
  if (days < 0) {
    return item.neededTo && item.neededTo >= today
      ? { label: 'Needed now', className: 'bg-red-50 text-red-700' }
      : { label: `Was needed ${formatDayMonth(item.neededFrom)}`, className: 'bg-red-50 text-red-700' };
  }
  if (days === 0) return { label: 'Needed today', className: 'bg-red-50 text-red-700' };
  if (days <= REQUEST_SOON_DAYS) {
    return { label: `Needed in ${days} ${days === 1 ? 'day' : 'days'}`, className: 'bg-orange-50 text-orange-700' };
  }
  return null;
}

function IncomingRequests({ items, emptyTitle, emptyText, renderActions }: IncomingRequestsProps) {
  const today = todayISO();

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 px-5 py-14 text-center">
        <p className="font-medium text-gray-900">{emptyTitle}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{emptyText}</p>
      </div>
    );
  }

  const sorted = [...items].sort(
    (a, b) =>
      Number(a.status === 'filled') - Number(b.status === 'filled') ||
      a.neededFrom.localeCompare(b.neededFrom) ||
      b.requestedOn.localeCompare(a.requestedOn),
  );

  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {sorted.map((item) => {
        const filled = item.status === 'filled';
        const flag = filled ? null : urgency(item, today);
        const actions = renderActions?.(item);
        return (
          <li
            key={item.id}
            className={`flex flex-col rounded-2xl border p-4 sm:p-5 ${
              filled ? 'border-gray-200 bg-gray-50/60' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon name={item.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900">{item.taskName}</p>
                <p className="truncate text-sm text-gray-500">{item.path.join(' · ')}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles[item.status]}`}
              >
                {requestStatusLabels[item.status]}
              </span>
            </div>

            <ul className="mt-4 space-y-1.5 rounded-xl bg-gray-50 p-3">
              {item.lines.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-gray-800">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-400" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <Icon name="calendarRange" className="h-4 w-4 text-gray-400" />
                {item.neededTo
                  ? `${formatDayMonth(item.neededFrom)}${item.neededTo !== item.neededFrom ? ` – ${formatDayMonth(item.neededTo)}` : ''}`
                  : `By ${formatDayMonth(item.neededFrom)}`}
              </span>
              {item.place && (
                <span className="flex min-w-0 items-center gap-1.5">
                  <Icon name="mapPin" className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate">{item.place}</span>
                </span>
              )}
              {flag && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${flag.className}`}>{flag.label}</span>
              )}
            </div>

            {item.note && <p className="mt-2 text-sm text-gray-600">“{item.note}”</p>}

            {item.progress && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-gray-600">
                <Icon name="circleCheck" className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <span>{item.progress}</span>
              </p>
            )}

            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
              <p className="text-xs text-gray-400">
                {item.code} · {item.requestedBy} · {formatDate(item.requestedOn)}
              </p>
              {actions}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default IncomingRequests;
