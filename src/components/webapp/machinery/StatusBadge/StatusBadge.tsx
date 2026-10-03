import type { DueState, MachineStatus } from '../../../../types/machinery';

/**
 * MachineStatusBadge / DueBadge
 *
 * Small pills for what a machine is doing and how close it is to its
 * off-hire date.
 */
const statusStyles: Record<MachineStatus | 'returned', { label: string; className: string; dot: string }> = {
  working: { label: 'Working', className: 'bg-blue-50 text-blue-700', dot: 'bg-blue-600' },
  idle: { label: 'Idle', className: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  breakdown: { label: 'Breakdown', className: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  returned: { label: 'Sent back', className: 'border border-gray-200 text-gray-500', dot: 'bg-gray-300' },
};

export function MachineStatusBadge({ status }: { status: MachineStatus | 'returned' }) {
  const style = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${style.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

/** "Overdue 5 days", "Due in 2 days", "Due today". Nothing when it's not close. */
export function DueBadge({ due, daysToDue }: { due: DueState | null; daysToDue?: number }) {
  if (!due || due === 'ok' || daysToDue === undefined) return null;
  if (due === 'overdue') {
    const late = -daysToDue;
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-red-700">
        Overdue {late} {late === 1 ? 'day' : 'days'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-orange-700">
      {daysToDue === 0 ? 'Due back today' : `Due back in ${daysToDue} ${daysToDue === 1 ? 'day' : 'days'}`}
    </span>
  );
}
