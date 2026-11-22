import { useMemo, useState } from 'react';
import Icon from '../../../common/Icon/Icon';
import { MarkBadge, WorkerAvatar } from '../WorkerBadge/WorkerBadge';
import { inputClass, primaryButtonClass } from '../../materials/formStyles';
import { MAX_OT_HOURS, MUSTER_EDIT_DAYS, attendanceMarks, getTrade } from '../../../../constants/labor';
import { compareWorkers, onRegisterOn, workFrontKey } from '../../../../utils/labor';
import { addDays, formatDate, formatNumber, todayISO } from '../../../../utils/materials';
import type { AttendanceMark, AttendanceRecord, WorkerSummary } from '../../../../types/labor';

/**
 * MusterRoll
 *
 * The morning roll call. Workers are grouped by the job they're on so a
 * foreman can call their gang through in one go; one tap marks each
 * worker, tapping the same mark again clears it. Overtime is added
 * against present workers at the end of the day. Marks can be corrected
 * for a week; older days are read-only.
 */
type MusterRollProps = {
  workers: WorkerSummary[];
  attendance: AttendanceRecord[];
  canManage: boolean;
  markedBy: string;
  onMark: (records: AttendanceRecord[]) => void;
  onUnmark: (workerId: string, date: string) => void;
  onOpen: (workerId: string) => void;
};

type Group = { key: string; title: string; subtitle?: string; members: WorkerSummary[] };

const markButton: Record<AttendanceMark, string> = {
  present: 'border-blue-600 bg-blue-600 text-white',
  'half-day': 'border-blue-300 bg-blue-100 text-blue-900',
  absent: 'border-red-500 bg-red-500 text-white',
  leave: 'border-gray-400 bg-gray-400 text-white',
};

/** Overtime box that only saves when you leave it, so typing "1.5" isn't cut short. */
function OtInput({
  id,
  value,
  disabled,
  onCommit,
}: {
  id: string;
  value?: number;
  disabled: boolean;
  onCommit: (hours: number | undefined) => void;
}) {
  const [text, setText] = useState(value ? String(value) : '');
  const commit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      if (value) onCommit(undefined);
      return;
    }
    const hours = Math.round(Number(trimmed) * 2) / 2;
    if (!(hours >= 0) || hours > MAX_OT_HOURS) {
      setText(value ? String(value) : '');
      return;
    }
    setText(hours ? String(hours) : '');
    if (hours !== (value ?? 0)) onCommit(hours || undefined);
  };
  return (
    <div className="relative w-20">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        max={MAX_OT_HOURS}
        step={0.5}
        value={text}
        disabled={disabled}
        placeholder="0"
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        aria-label="Overtime hours"
        className={`${inputClass} py-1.5 pr-8 text-right`}
      />
      <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-gray-400">hrs</span>
    </div>
  );
}

function MusterRoll({ workers, attendance, canManage, markedBy, onMark, onUnmark, onOpen }: MusterRollProps) {
  const today = todayISO();
  const [date, setDate] = useState(today);
  const editable = canManage && date <= today && date >= addDays(today, -MUSTER_EDIT_DAYS);

  const marks = useMemo(
    () => new Map(attendance.filter((r) => r.date === date).map((r) => [r.workerId, r])),
    [attendance, date],
  );

  const onRoll = useMemo(
    () => workers.filter((w) => onRegisterOn(w.worker, date)).sort(compareWorkers),
    [workers, date],
  );

  // Grouped by the job each worker is on now; jobs in the order they started.
  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    const free: WorkerSummary[] = [];
    [...onRoll]
      .sort((a, b) => (a.assignment?.startedOn ?? '').localeCompare(b.assignment?.startedOn ?? ''))
      .forEach((w) => {
        const a = w.assignment;
        if (!a) {
          free.push(w);
          return;
        }
        const key = workFrontKey(a.activity, a.location);
        const group = map.get(key) ?? { key, title: a.activity, subtitle: a.location, members: [] };
        group.members.push(w);
        map.set(key, group);
      });
    const list = [...map.values()].map((g) => ({ ...g, members: g.members.sort(compareWorkers) }));
    if (free.length) list.push({ key: 'none', title: 'No work allocated', members: free.sort(compareWorkers) });
    return list;
  }, [onRoll]);

  const markOf = (w: WorkerSummary) => marks.get(w.worker.id)?.mark;
  const present = onRoll.filter((w) => markOf(w) === 'present' || markOf(w) === 'half-day').length;
  const off = onRoll.filter((w) => markOf(w) === 'absent' || markOf(w) === 'leave').length;
  const unmarked = onRoll.filter((w) => !marks.has(w.worker.id));

  const setMark = (w: WorkerSummary, mark: AttendanceMark) => {
    const current = marks.get(w.worker.id);
    if (current?.mark === mark) {
      onUnmark(w.worker.id, date);
      return;
    }
    const worked = mark === 'present' || mark === 'half-day';
    onMark([
      { workerId: w.worker.id, date, mark, otHours: worked ? current?.otHours : undefined, markedBy },
    ]);
  };

  const markRestPresent = (members: WorkerSummary[]) => {
    const rest = members.filter((w) => !marks.has(w.worker.id));
    if (rest.length) onMark(rest.map((w) => ({ workerId: w.worker.id, date, mark: 'present', markedBy })));
  };

  const setOt = (w: WorkerSummary, hours: number | undefined) => {
    const current = marks.get(w.worker.id);
    if (!current) return;
    onMark([{ ...current, otHours: hours, markedBy }]);
  };

  const shiftDate = (days: number) => setDate((d) => addDays(d, days));

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              aria-label="Previous day"
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <Icon name="arrowLeft" className="h-4 w-4" />
            </button>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              aria-label="Muster date"
              className={`${inputClass} w-auto`}
            />
            <button
              type="button"
              onClick={() => shiftDate(1)}
              disabled={date >= today}
              aria-label="Next day"
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="arrowRight" className="h-4 w-4" />
            </button>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{date === today ? 'Today' : formatDate(date)}</p>
            <p className="text-xs text-gray-500">
              {present} present · {off} off ·{' '}
              <span className={unmarked.length ? 'font-medium text-amber-700' : ''}>
                {unmarked.length} not marked
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {editable && unmarked.length > 0 && (
            <button type="button" onClick={() => markRestPresent(onRoll)} className={`${primaryButtonClass} py-2`}>
              <Icon name="check" className="h-4 w-4" />
              Mark the rest present
            </button>
          )}
        </div>
      </div>

      {!editable && canManage && (
        <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <Icon name="lock" className="h-4 w-4 text-gray-400" />
          Muster marks older than {MUSTER_EDIT_DAYS} days are locked for payroll.
        </p>
      )}

      {onRoll.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 px-5 py-14 text-center">
          <p className="font-medium text-gray-900">Nobody was on the register</p>
          <p className="mt-1 text-sm text-gray-500">Pick a later date.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {groups.map((group) => {
            const groupUnmarked = group.members.filter((w) => !marks.has(w.worker.id)).length;
            return (
              <section key={group.key} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-4 py-2.5 sm:px-5">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-gray-900">{group.title}</h3>
                    {group.subtitle && (
                      <p className="flex items-center gap-1 truncate text-xs text-gray-500">
                        <Icon name="mapPin" className="h-3 w-3 shrink-0" />
                        {group.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      {group.members.length - groupUnmarked}/{group.members.length} marked
                    </span>
                    {editable && groupUnmarked > 0 && (
                      <button
                        type="button"
                        onClick={() => markRestPresent(group.members)}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        All present
                      </button>
                    )}
                  </div>
                </header>
                <ul className="divide-y divide-gray-100">
                  {group.members.map((w) => {
                    const record = marks.get(w.worker.id);
                    const worked = record?.mark === 'present' || record?.mark === 'half-day';
                    return (
                      <li
                        key={w.worker.id}
                        className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                      >
                        <button
                          type="button"
                          onClick={() => onOpen(w.worker.id)}
                          className="flex min-w-0 items-center gap-3 text-left"
                        >
                          <WorkerAvatar name={w.worker.name} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-gray-900 hover:text-blue-700">
                              {w.worker.name}
                            </span>
                            <span className="block truncate text-xs text-gray-400">
                              {getTrade(w.worker.trade).label}
                            </span>
                          </span>
                        </button>

                        {editable ? (
                          <div className="flex items-center gap-3 pl-11 sm:pl-0">
                            <div className="flex gap-1" role="group" aria-label={`Mark ${w.worker.name}`}>
                              {attendanceMarks.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  aria-pressed={record?.mark === m.id}
                                  onClick={() => setMark(w, m.id)}
                                  title={m.label}
                                  className={`h-9 min-w-9 rounded-lg border px-2 text-sm font-semibold transition-colors ${
                                    record?.mark === m.id
                                      ? markButton[m.id]
                                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-900'
                                  }`}
                                >
                                  <span aria-hidden="true">{m.short}</span>
                                  <span className="sr-only">{m.label}</span>
                                </button>
                              ))}
                            </div>
                            <OtInput
                              key={`${w.worker.id}-${date}-${record?.otHours ?? 0}`}
                              id={`ot-${w.worker.id}`}
                              value={record?.otHours}
                              disabled={!worked}
                              onCommit={(hours) => setOt(w, hours)}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 pl-11 sm:pl-0">
                            <MarkBadge mark={record?.mark} />
                            {worked && record?.otHours ? (
                              <span className="text-xs text-gray-500">+{formatNumber(record.otHours, 1)} hrs OT</span>
                            ) : null}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {editable && (
        <p className="mt-4 text-xs text-gray-400">
          P present · ½ half day · A absent · L leave. Tap a mark again to clear it.
        </p>
      )}
    </div>
  );
}

export default MusterRoll;
