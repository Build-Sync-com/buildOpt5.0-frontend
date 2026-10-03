import Icon from '../../../common/Icon/Icon';
import type { IconName } from '../../../common/Icon/Icon';
import { checkoutOverdue, compactRupees } from '../../../../utils/machinery';
import type { MachineSummary, ToolCheckout, ToolStock } from '../../../../types/machinery';

/**
 * MachineryStats
 *
 * Four headline tiles: machines on site and what they're doing, hire owed so
 * far, off-hire dates coming up, and tools out with workers.
 */
type Stat = {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  /** Amber icon to pull the eye - used when something needs action. */
  alert?: boolean;
};

type MachineryStatsProps = {
  machines: MachineSummary[];
  tools: ToolStock[];
  checkouts: ToolCheckout[];
};

function MachineryStats({ machines, tools, checkouts }: MachineryStatsProps) {
  const onSite = machines.filter((m) => !m.returned);
  const working = onSite.filter((m) => m.status === 'working').length;
  const idle = onSite.filter((m) => m.status === 'idle').length;
  const broken = onSite.filter((m) => m.status === 'breakdown').length;

  const hiredOnSite = onSite.filter((m) => m.machine.ownership === 'hired');
  const hire =
    hiredOnSite.reduce((sum, m) => sum + m.hireCost, 0) + tools.reduce((sum, t) => sum + t.hireCost, 0);

  const overdue = onSite.filter((m) => m.due === 'overdue').length;
  const dueSoon = onSite.filter((m) => m.due === 'soon').length;

  const open = checkouts.filter((c) => !c.checkIn);
  const piecesOut = tools.reduce((sum, t) => sum + t.out, 0);
  const lateSlips = open.filter((c) => checkoutOverdue(c)).length;

  const stats: Stat[] = [
    {
      label: 'Machines on site',
      value: String(onSite.length),
      note: [`${working} working`, idle && `${idle} idle`, broken && `${broken} broken down`]
        .filter(Boolean)
        .join(' · '),
      icon: 'tractor',
      alert: broken > 0,
    },
    {
      label: 'Hire running',
      value: compactRupees(hire),
      note: `Owed so far on ${hiredOnSite.length} hired ${hiredOnSite.length === 1 ? 'machine' : 'machines'} and tools`,
      icon: 'banknote',
    },
    {
      label: 'Off-hire due',
      value: String(overdue + dueSoon),
      note: overdue ? `${overdue} past the off-hire date` : 'Within the next 3 days',
      icon: 'clock',
      alert: overdue > 0,
    },
    {
      label: 'Tools out',
      value: String(piecesOut),
      note: lateSlips
        ? `${lateSlips} ${lateSlips === 1 ? 'slip' : 'slips'} overdue`
        : `On ${open.length} open tool ${open.length === 1 ? 'slip' : 'slips'}`,
      icon: 'hammer',
      alert: lateSlips > 0,
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

export default MachineryStats;
