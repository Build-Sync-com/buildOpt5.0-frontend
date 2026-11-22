import Icon from '../../../common/Icon/Icon';
import type { IconName } from '../../../common/Icon/Icon';
import { compactRupees } from '../../../../utils/machinery';
import { formatNumber } from '../../../../utils/materials';
import { wageFor } from '../../../../utils/labor';
import type { WorkerSummary } from '../../../../types/labor';

/**
 * LaborStats
 *
 * Four headline tiles for this morning: who turned up, who's free to put on
 * work, who's off, and what today's muster costs in wages.
 */
type Stat = {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  /** Amber icon to pull the eye - used when something needs action. */
  alert?: boolean;
};

function LaborStats({ workers }: { workers: WorkerSummary[] }) {
  const active = workers.filter((w) => !w.worker.release);
  const present = active.filter((w) => w.today?.mark === 'present' || w.today?.mark === 'half-day');
  const halfDays = present.filter((w) => w.today?.mark === 'half-day').length;
  const unmarked = active.filter((w) => !w.today).length;

  const free = active.filter((w) => w.status === 'free').length;
  const absent = active.filter((w) => w.status === 'absent');
  const onLeave = active.filter((w) => w.status === 'leave').length;
  const absentFromJob = absent.filter((w) => w.assignment).length;

  const wages = present.reduce((sum, w) => sum + (w.today ? wageFor(w.worker, w.today) : 0), 0);
  const otHours = present.reduce((sum, w) => sum + (w.today?.otHours ?? 0), 0);

  const stats: Stat[] = [
    {
      label: 'On site today',
      value: `${present.length}/${active.length}`,
      note: unmarked
        ? `${unmarked} not marked yet`
        : halfDays
          ? `${halfDays} on a half day`
          : 'Muster roll complete',
      icon: 'users',
      alert: unmarked > 0,
    },
    {
      label: 'Free to allocate',
      value: String(free),
      note: free ? 'Present with no work allocated' : 'Everyone present has work',
      icon: 'userPlus',
      alert: free > 0,
    },
    {
      label: 'Off today',
      value: String(absent.length + onLeave),
      note:
        [absent.length && `${absent.length} absent`, onLeave && `${onLeave} on leave`].filter(Boolean).join(' · ') +
        (absentFromJob ? ` · ${absentFromJob} missing from a job` : '') || 'Nobody off',
      icon: 'userMinus',
      alert: absentFromJob > 0,
    },
    {
      label: 'Wage bill today',
      value: compactRupees(wages),
      note: otHours ? `Includes ${formatNumber(otHours, 1)} OT hours` : 'From today’s muster',
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
              className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:flex ${
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

export default LaborStats;
