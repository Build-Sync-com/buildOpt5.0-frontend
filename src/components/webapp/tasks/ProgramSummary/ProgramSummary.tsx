import Icon from '../../../common/Icon/Icon';
import type { IconName } from '../../../common/Icon/Icon';
import { LEAF_LEVEL } from '../../../../constants/program';
import { countWorkingDays, formatWorkingDays, isOnNow } from '../../../../utils/program';
import { daysBetween, formatDate, todayISO } from '../../../../utils/materials';
import type { ProgramNode, Schedule } from '../../../../types/program';

/**
 * ProgramSummary
 *
 * Four tiles for the whole program: when it starts and finishes, how many
 * working days it runs and how far in we are, and how many sub-tasks are
 * under way today (today falls between their start and finish).
 */
type ProgramSummaryProps = {
  root: ProgramNode;
  tasks: ProgramNode[];
  schedules: Record<string, Schedule>;
  holidays: Set<string>;
};

type Stat = { label: string; value: string; note: string; icon: IconName };

function ProgramSummary({ root, tasks, schedules, holidays }: ProgramSummaryProps) {
  const today = todayISO();
  const overall = schedules[root.id];
  const subTasks = tasks.filter((t) => t.level === LEAF_LEVEL);
  const onNow = subTasks.filter((t) => isOnNow(schedules[t.id], today)).length;

  const start = overall?.scheduled ? overall.start : null;
  const finish = overall?.scheduled ? overall.finish : null;
  const elapsed = start && finish && today >= start ? countWorkingDays(start, today < finish ? today : finish, holidays) : 0;

  const stats: Stat[] = [
    {
      label: 'Program start',
      value: start ? formatDate(start) : '-',
      note: start ? (today >= start ? `${daysBetween(start, today)} days ago` : `In ${daysBetween(today, start)} days`) : 'Not scheduled yet',
      icon: 'calendarRange',
    },
    {
      label: 'Program finish',
      value: finish ? formatDate(finish) : '-',
      note: finish ? (today <= finish ? `In ${daysBetween(today, finish)} days` : 'Planned finish has passed') : 'Not scheduled yet',
      icon: 'calendarCheck',
    },
    {
      label: 'Working days',
      value: overall?.duration ? String(overall.duration) : '-',
      note: overall?.duration ? `${formatWorkingDays(elapsed)} in so far` : 'Not scheduled yet',
      icon: 'clock',
    },
    {
      label: 'Under way now',
      value: String(onNow),
      note: `Of ${subTasks.length} sub-tasks in the program`,
      icon: 'listChecks',
    },
  ];

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 sm:text-sm">{stat.label}</span>
            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 sm:flex">
              <Icon name={stat.icon} className="h-[18px] w-[18px]" />
            </span>
          </div>
          <p className="mt-2 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{stat.value}</p>
          <p className="mt-2 text-xs text-gray-400">{stat.note}</p>
        </div>
      ))}
    </div>
  );
}

export default ProgramSummary;
