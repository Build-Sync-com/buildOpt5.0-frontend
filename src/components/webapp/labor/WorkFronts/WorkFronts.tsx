import { useState } from 'react';
import Icon from '../../../common/Icon/Icon';
import { MarkBadge, WorkerAvatar } from '../WorkerBadge/WorkerBadge';
import { accentButtonClass, secondaryButtonClass } from '../../materials/formStyles';
import { getTrade } from '../../../../constants/labor';
import { compareWorkers, groupWorkFronts } from '../../../../utils/labor';
import { formatDayMonth } from '../../../../utils/materials';
import type { WorkFront, WorkerSummary } from '../../../../types/labor';

/**
 * WorkFronts
 *
 * Who's doing what, right now. Free workers sit at the top, ready to be
 * put on a job; underneath, each job on site with its gang, how long
 * it's been running, and who's missing from it today.
 */
type WorkFrontsProps = {
  workers: WorkerSummary[];
  canManage: boolean;
  onOpen: (workerId: string) => void;
  onAllocate: (preset?: { workerIds?: string[]; activity?: string; location?: string }) => void;
  onFinish: (front: WorkFront) => void;
};

function FinishButton({ front, onFinish }: { front: WorkFront; onFinish: (front: WorkFront) => void }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={`${secondaryButtonClass} px-3 py-1.5`}>
        <Icon name="circleCheck" className="h-4 w-4" />
        Job finished
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <span className="text-xs text-gray-600">
        Free all {front.members.length}?
      </span>
      <button
        type="button"
        onClick={() => onFinish(front)}
        className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-800"
      >
        Yes, finished
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        Cancel
      </button>
    </span>
  );
}

function FrontCard({
  front,
  canManage,
  onOpen,
  onAllocate,
  onFinish,
}: { front: WorkFront } & Omit<WorkFrontsProps, 'workers'>) {
  const missing = front.members.filter((m) => m.status === 'absent' || m.status === 'leave');

  return (
    <li className="flex flex-col rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-gray-900">{front.activity}</h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-gray-500">
            <Icon name="mapPin" className="h-3.5 w-3.5 shrink-0" />
            {front.location}
          </p>
          <p className="mt-1 text-xs text-gray-400">Since {formatDayMonth(front.startedOn)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            missing.length ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
          }`}
        >
          {front.members.length - missing.length}/{front.members.length} here
        </span>
      </div>

      <ul className="divide-y divide-gray-100 border-t border-gray-100">
        {front.members.map((m) => (
          <li key={m.worker.id}>
            <button
              type="button"
              onClick={() => onOpen(m.worker.id)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 sm:px-5"
            >
              <WorkerAvatar name={m.worker.name} size="sm" muted={m.status === 'absent' || m.status === 'leave'} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-gray-900">{m.worker.name}</span>
                <span className="block truncate text-xs text-gray-400">{getTrade(m.worker.trade).label}</span>
              </span>
              <MarkBadge mark={m.today?.mark} />
            </button>
          </li>
        ))}
      </ul>

      {canManage && (
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/60 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => onAllocate({ activity: front.activity, location: front.location })}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add workers
          </button>
          <FinishButton key={front.key} front={front} onFinish={onFinish} />
        </div>
      )}
    </li>
  );
}

function WorkFronts({ workers, canManage, onOpen, onAllocate, onFinish }: WorkFrontsProps) {
  const fronts = groupWorkFronts(workers);
  const free = workers.filter((w) => w.status === 'free').sort(compareWorkers);

  return (
    <div>
      {/* Free now */}
      <section
        className={`rounded-2xl border p-4 sm:p-5 ${
          free.length ? 'border-amber-300 bg-amber-50/60' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              {free.length ? `${free.length} free right now` : 'Nobody’s free right now'}
            </h3>
            <p className="text-sm text-gray-500">
              {free.length ? 'Present today with no work allocated.' : 'Everyone present is on a job.'}
            </p>
          </div>
          {canManage && free.length > 0 && (
            <button
              type="button"
              onClick={() => onAllocate({ workerIds: free.map((w) => w.worker.id) })}
              className={accentButtonClass}
            >
              <Icon name="arrowRightLeft" className="h-4 w-4" />
              Allocate free workers
            </button>
          )}
        </div>
        {free.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {free.map((w) => (
              <li key={w.worker.id}>
                <button
                  type="button"
                  onClick={() => onOpen(w.worker.id)}
                  className="flex items-center gap-2 rounded-full border border-amber-200 bg-white py-1 pr-3 pl-1 text-left transition-colors hover:border-amber-400"
                >
                  <WorkerAvatar name={w.worker.name} size="sm" />
                  <span>
                    <span className="block text-sm leading-tight font-medium text-gray-900">
                      {w.worker.callingName ?? w.worker.name}
                    </span>
                    <span className="block text-xs leading-tight text-gray-500">
                      {getTrade(w.worker.trade).label}
                      {w.today?.mark === 'half-day' && ' · half day'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Jobs */}
      {fronts.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 px-5 py-14 text-center">
          <p className="font-medium text-gray-900">No work allocated</p>
          <p className="mt-1 text-sm text-gray-500">Allocate workers to an activity to see the gangs here.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 lg:grid-cols-2">
          {fronts.map((front) => (
            <FrontCard
              key={front.key}
              front={front}
              canManage={canManage}
              onOpen={onOpen}
              onAllocate={onAllocate}
              onFinish={onFinish}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default WorkFronts;
