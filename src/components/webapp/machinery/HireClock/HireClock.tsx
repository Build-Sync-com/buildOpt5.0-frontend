import { daysBetween, formatDayMonth, todayISO } from '../../../../utils/materials';

/**
 * HireClock
 *
 * A machine's hire period as a bar from arrival to its off-hire date, filled
 * up to today. Past the off-hire date the bar turns red; with no date agreed
 * it shows as open-ended.
 */
type HireClockProps = {
  arrivedOn: string;
  dueBack?: string;
  /** Ends the clock early - the date it was sent back. */
  returnedOn?: string;
  className?: string;
};

function HireClock({ arrivedOn, dueBack, returnedOn, className = '' }: HireClockProps) {
  const end = returnedOn ?? todayISO();
  const elapsed = daysBetween(arrivedOn, end) + 1;

  if (!dueBack) {
    return (
      <div className={className}>
        <div className="relative h-2 overflow-hidden rounded-full border border-dashed border-gray-300">
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${
              returnedOn ? 'w-full bg-gray-300' : 'w-2/3 bg-linear-to-r from-blue-600 to-blue-600/0'
            }`}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-gray-500">
          <span>Arrived {formatDayMonth(arrivedOn)}</span>
          <span className="text-gray-400">{returnedOn ? `Back ${formatDayMonth(returnedOn)}` : 'No off-hire date'}</span>
        </div>
      </div>
    );
  }

  const planned = Math.max(1, daysBetween(arrivedOn, dueBack) + 1);
  const overdue = !returnedOn && end > dueBack;
  // Overdue bars fill completely; the planned span shrinks to show the overrun.
  const span = Math.max(planned, elapsed);
  const plannedPct = (planned / span) * 100;
  const elapsedPct = Math.min(100, (elapsed / span) * 100);

  return (
    <div className={className}>
      <div
        className="relative h-2 overflow-hidden rounded-full bg-gray-100"
        role="img"
        aria-label={`Day ${elapsed} of ${planned} planned`}
      >
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${
            overdue ? 'bg-red-500' : returnedOn ? 'bg-gray-400' : 'bg-blue-600'
          }`}
          style={{ width: `${elapsedPct}%` }}
        />
        {overdue && (
          <div
            className="absolute inset-y-0 w-0.5 bg-white"
            style={{ left: `${plannedPct}%` }}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="mt-1.5 flex justify-between gap-2 text-xs text-gray-500">
        <span>Arrived {formatDayMonth(arrivedOn)}</span>
        <span className={overdue ? 'font-medium text-red-600' : 'text-gray-400'}>
          {returnedOn ? `Back ${formatDayMonth(returnedOn)}` : `Off-hire ${formatDayMonth(dueBack)}`}
        </span>
      </div>
    </div>
  );
}

export default HireClock;
