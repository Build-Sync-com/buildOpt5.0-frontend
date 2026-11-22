import { nameInitials } from '../../../../utils/labor';
import type { AttendanceMark, WorkerStatus } from '../../../../types/labor';

/**
 * WorkerAvatar / WorkerStatusBadge / MarkBadge
 *
 * Initials avatar, where a worker stands today, and a single muster mark.
 * Free workers are amber - the same safety-yellow as "Allocate workers" -
 * so they stand out to whoever is handing out work.
 */
const statusStyles: Record<WorkerStatus, { label: string; className: string; dot: string }> = {
  assigned: { label: 'On a job', className: 'bg-blue-50 text-blue-700', dot: 'bg-blue-600' },
  free: { label: 'Free', className: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  absent: { label: 'Absent', className: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  leave: { label: 'On leave', className: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  unmarked: { label: 'Not marked', className: 'border border-dashed border-gray-300 text-gray-500', dot: 'bg-gray-300' },
  released: { label: 'Released', className: 'border border-gray-200 text-gray-500', dot: 'bg-gray-300' },
};

export function WorkerStatusBadge({ status }: { status: WorkerStatus }) {
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

const markStyles: Record<AttendanceMark, { label: string; className: string }> = {
  present: { label: 'Present', className: 'bg-blue-50 text-blue-700' },
  'half-day': { label: 'Half day', className: 'bg-blue-50 text-blue-700' },
  absent: { label: 'Absent', className: 'bg-red-50 text-red-700' },
  leave: { label: 'Leave', className: 'bg-gray-100 text-gray-600' },
};

/** Muster squares: solid colour per mark, used by the roll and the 14-day strip. */
export function MarkSquare({ mark, label }: { mark?: AttendanceMark; label: string }) {
  const tone = !mark
    ? 'border border-dashed border-gray-300 text-gray-400'
    : mark === 'present'
      ? 'bg-blue-600 text-white'
      : mark === 'half-day'
        ? 'bg-blue-200 text-blue-900'
        : mark === 'absent'
          ? 'bg-red-500 text-white'
          : 'bg-gray-300 text-gray-700';
  return (
    <span
      className={`flex h-7 w-full items-center justify-center rounded-md text-[11px] font-semibold ${tone}`}
      title={label}
    >
      {mark === 'half-day' ? '½' : mark === 'absent' ? 'A' : mark === 'leave' ? 'L' : mark ? 'P' : '–'}
    </span>
  );
}

/** Today's mark, or "Not marked". */
export function MarkBadge({ mark }: { mark?: AttendanceMark }) {
  if (!mark) {
    return (
      <span className="inline-flex items-center rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-gray-500">
        Not marked
      </span>
    );
  }
  const style = markStyles[mark];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${style.className}`}
    >
      {style.label}
    </span>
  );
}

type WorkerAvatarProps = {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  /** Greyed out for released workers. */
  muted?: boolean;
};

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function WorkerAvatar({ name, size = 'md', muted }: WorkerAvatarProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${sizes[size]} ${
        muted ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-700'
      }`}
      aria-hidden="true"
    >
      {nameInitials(name)}
    </span>
  );
}
