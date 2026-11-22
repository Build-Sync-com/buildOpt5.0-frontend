import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Icon from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../../materials/SectionHeading/SectionHeading';
import { FormField } from '../../materials/FormField/FormField';
import { accentButtonClass, inputClass, secondaryButtonClass } from '../../materials/formStyles';
import { WorkerAvatar } from '../WorkerBadge/WorkerBadge';
import { MUSTER_EDIT_DAYS, getTrade, trades } from '../../../../constants/labor';
import { compareWorkers, tradeMix, workFrontKey, workerCode } from '../../../../utils/labor';
import { addDays, formatDayMonth, todayISO } from '../../../../utils/materials';
import type { AllocationDraft, TradeId, WorkerSummary } from '../../../../types/labor';
import type { LaborRequestFill } from '../../../../types/taskRequests';

/**
 * AllocateForm
 *
 * Puts workers on a job: an activity at a work front. Free workers are
 * listed first; picking someone already on another job moves them, and
 * the form says so before it's saved.
 *
 * Opened from a labour request, it fills that request: the job and dates
 * come from the request, its trades are listed first, and a tally shows
 * each trade's progress as workers are picked. The new allocations carry
 * the request's id, which is how the request knows it's been filled.
 */

/** The labour request being filled, when opened from one. */
export type AllocateRequest = {
  requestId: string;
  /** "LR-301". */
  code: string;
  fill: LaborRequestFill;
  neededFrom: string;
  neededTo: string;
};
type AllocateFormProps = {
  workers: WorkerSummary[];
  activities: string[];
  locations: string[];
  assignedBy: string;
  initialWorkerIds?: string[];
  initialActivity?: string;
  initialLocation?: string;
  initialStartedOn?: string;
  initialExpectedEnd?: string;
  request?: AllocateRequest;
  onSubmit: (draft: AllocationDraft) => void;
  onClose: () => void;
};

type Header = {
  activity: string;
  location: string;
  startedOn: string;
  expectedEnd: string;
  note: string;
};

type Errors = Partial<Record<keyof Header | 'workers', string>>;

type Band = { id: string; title: string; members: WorkerSummary[] };

function AllocateForm({
  workers,
  activities,
  locations,
  assignedBy,
  initialWorkerIds = [],
  initialActivity = '',
  initialLocation = '',
  initialStartedOn,
  initialExpectedEnd,
  request,
  onSubmit,
  onClose,
}: AllocateFormProps) {
  const formId = useId();
  const listId = useId();
  const today = todayISO();

  const [header, setHeader] = useState<Header>({
    activity: initialActivity,
    location: initialLocation,
    startedOn: initialStartedOn ?? today,
    expectedEnd: initialExpectedEnd ?? '',
    note: '',
  });
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialWorkerIds));
  const [trade, setTrade] = useState<TradeId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // A request's trades come first, so the right workers are at the top of each group.
  const active = useMemo(() => {
    const wanted = new Set(request?.fill.lines.map((l) => l.trade));
    return workers
      .filter((w) => !w.worker.release)
      .sort((a, b) => Number(wanted.has(b.worker.trade)) - Number(wanted.has(a.worker.trade)) || compareWorkers(a, b));
  }, [workers, request]);
  // Starting up to a week ahead, or on the day a request needs them.
  const latestStart = request && request.neededFrom > addDays(today, 7) ? request.neededFrom : addDays(today, 7);
  const key = header.activity.trim() && header.location.trim() ? workFrontKey(header.activity, header.location) : null;
  const onThisJob = (w: WorkerSummary) =>
    Boolean(key && w.assignment && workFrontKey(w.assignment.activity, w.assignment.location) === key);

  const q = query.trim().toLowerCase();
  const bands: Band[] = useMemo(() => {
    const visible = active
      .filter((w) => trade === 'all' || w.worker.trade === trade)
      .filter(
        (w) =>
          !q ||
          [w.worker.name, w.worker.callingName, workerCode(w.worker.workerNo), getTrade(w.worker.trade).label]
            .join(' ')
            .toLowerCase()
            .includes(q),
      );
    const off = (w: WorkerSummary) => w.status === 'absent' || w.status === 'leave';
    return [
      { id: 'free', title: 'Free now', members: visible.filter((w) => w.status === 'free') },
      { id: 'unmarked', title: 'No job · not on the muster yet', members: visible.filter((w) => w.status === 'unmarked') },
      { id: 'busy', title: 'On other jobs', members: visible.filter((w) => w.assignment && !off(w)) },
      { id: 'off', title: 'Off today', members: visible.filter(off) },
    ].filter((b) => b.members.length > 0);
  }, [active, trade, q]);

  const chosen = active.filter((w) => selected.has(w.worker.id));
  const moving = chosen.filter((w) => w.assignment && !onThisJob(w));
  const offChosen = chosen.filter((w) => w.status === 'absent' || w.status === 'leave');

  const validate = (): Errors => {
    const e: Errors = {};
    if (!header.activity.trim()) e.activity = 'What will they be doing?';
    if (!header.location.trim()) e.location = 'Where on site?';
    const earliest = addDays(today, -MUSTER_EDIT_DAYS);
    if (!header.startedOn) e.startedOn = 'Enter the date.';
    else if (header.startedOn < earliest) e.startedOn = `No more than ${MUSTER_EDIT_DAYS} days back.`;
    else if (header.startedOn > latestStart) e.startedOn = request ? 'After the request needs them.' : 'No more than a week ahead.';
    if (header.expectedEnd && header.startedOn && header.expectedEnd < header.startedOn) {
      e.expectedEnd = 'Before it starts.';
    }
    const toAdd = chosen.filter((w) => !onThisJob(w));
    if (toAdd.length === 0) e.workers = chosen.length ? 'They’re all on this job already.' : 'Pick at least one worker.';
    const tooEarly = toAdd.find((w) => header.startedOn && w.worker.joinedOn > header.startedOn);
    if (tooEarly) e.startedOn = `${tooEarly.worker.callingName ?? tooEarly.worker.name} joined on ${formatDayMonth(tooEarly.worker.joinedOn)}.`;
    return e;
  };

  const errors = submitted ? validate() : {};
  const hasErrors = Object.keys(errors).length > 0;

  const updateHeader = (patch: Partial<Header>) => setHeader((prev) => ({ ...prev, ...patch }));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const selectAll = (members: WorkerSummary[]) =>
    setSelected((prev) => {
      const next = new Set(prev);
      members.filter((w) => !onThisJob(w)).forEach((w) => next.add(w.worker.id));
      return next;
    });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate()).length > 0) return;
    onSubmit({
      workerIds: chosen.filter((w) => !onThisJob(w)).map((w) => w.worker.id),
      activity: header.activity.trim().replace(/\s+/g, ' '),
      location: header.location.trim().replace(/\s+/g, ' '),
      startedOn: header.startedOn,
      expectedEnd: header.expectedEnd || undefined,
      note: header.note.trim() || undefined,
      assignedBy,
      requestId: request?.requestId,
    });
  };

  const adding = chosen.filter((w) => !onThisJob(w));
  // Per requested trade: allocated before, plus picked now (not already on the request).
  const tally = request?.fill.lines.map((l) => {
    const picked = adding.filter(
      (w) => w.worker.trade === l.trade && !request.fill.workerIds.includes(w.worker.id),
    ).length;
    return { ...l, picked, total: l.allocated + picked };
  });
  const offRequest = request
    ? adding.filter((w) => !request.fill.lines.some((l) => l.trade === w.worker.trade)).length
    : 0;
  const tradesOnSite = trades.filter((t) => active.some((w) => w.worker.trade === t.id));

  return (
    <SlideOver
      open
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      eyebrow={request ? `Filling ${request.code}` : 'Work allocation'}
      title="Allocate workers"
      description={
        request
          ? 'Put workers on the requested sub-task. Each one counts towards the request.'
          : 'Put workers on an activity at a work front. They stay on it until moved or the job is finished.'
      }
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-gray-900">
              {adding.length} {adding.length === 1 ? 'worker' : 'workers'}
            </p>
            <p className="truncate text-xs text-gray-400">
              {adding.length ? tradeMix(adding) : `Allocated by ${assignedBy}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
              Cancel
            </button>
            <button type="submit" form={formId} className={`${accentButtonClass} flex-1 sm:flex-none`}>
              <Icon name="arrowRightLeft" className="h-4 w-4" />
              Allocate
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errors.workers && Object.keys(errors).length === 1
              ? errors.workers
              : 'Some details are missing - check the highlighted fields.'}
          </p>
        )}

        {tally && request && (
          <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">{request.code} asks for</p>
              <p className="text-xs text-gray-500">
                {formatDayMonth(request.neededFrom)}
                {request.neededTo !== request.neededFrom && <> – {formatDayMonth(request.neededTo)}</>}
              </p>
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {tally.map((l) => {
                const done = l.total >= l.requested;
                return (
                  <li
                    key={l.trade}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          done ? 'bg-blue-600 text-white' : 'border border-gray-300 text-transparent'
                        }`}
                      >
                        <Icon name="check" className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                      <span className="truncate text-gray-900">{getTrade(l.trade).label}</span>
                    </span>
                    <span className={`shrink-0 font-semibold ${done ? 'text-blue-700' : 'text-gray-700'}`}>
                      {l.total}/{l.requested}
                      {l.picked > 0 && <span className="ml-1 text-xs font-normal text-gray-400">(+{l.picked})</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
            {offRequest > 0 && (
              <p className="mt-3 text-xs text-gray-500">
                {offRequest} picked {offRequest === 1 ? 'isn’t' : 'aren’t'} a requested trade - they’ll go on the job
                but won’t count towards the request.
              </p>
            )}
          </div>
        )}

        <SectionHeading title="The job" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Activity" htmlFor="al-activity" required error={errors.activity}>
            <input
              id="al-activity"
              list={`${listId}-activities`}
              value={header.activity}
              onChange={(e) => updateHeader({ activity: e.target.value })}
              placeholder="e.g. Brickwork"
              autoComplete="off"
              aria-invalid={Boolean(errors.activity)}
              className={inputClass}
            />
            <datalist id={`${listId}-activities`}>
              {activities.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Work front" htmlFor="al-location" required error={errors.location}>
            <input
              id="al-location"
              list={`${listId}-locations`}
              value={header.location}
              onChange={(e) => updateHeader({ location: e.target.value })}
              placeholder="e.g. Block A · Level 3"
              autoComplete="off"
              aria-invalid={Boolean(errors.location)}
              className={inputClass}
            />
            <datalist id={`${listId}-locations`}>
              {locations.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Starting" htmlFor="al-start" required error={errors.startedOn}>
            <input
              id="al-start"
              type="date"
              min={addDays(today, -MUSTER_EDIT_DAYS)}
              max={latestStart}
              value={header.startedOn}
              onChange={(e) => updateHeader({ startedOn: e.target.value })}
              aria-invalid={Boolean(errors.startedOn)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Target finish" htmlFor="al-end" error={errors.expectedEnd} hint="Optional">
            <input
              id="al-end"
              type="date"
              min={header.startedOn}
              value={header.expectedEnd}
              onChange={(e) => updateHeader({ expectedEnd: e.target.value })}
              aria-invalid={Boolean(errors.expectedEnd)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Instructions" htmlFor="al-note" className="sm:col-span-2">
            <input
              id="al-note"
              value={header.note}
              onChange={(e) => updateHeader({ note: e.target.value })}
              placeholder="e.g. Grid lines 3–6, finish the east wall first"
              className={inputClass}
            />
          </FormField>
        </div>

        <SectionHeading
          title="Workers"
          aside={selected.size ? `${selected.size} picked` : 'Free workers first'}
          className="mt-8"
        />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or number"
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

        {errors.workers && (
          <p id="al-workers-error" className="mt-2 text-xs text-red-600">
            {errors.workers}
          </p>
        )}

        {bands.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
            No workers match.
          </p>
        ) : (
          <div className="mt-4 space-y-5">
            {bands.map((band) => (
              <div key={band.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    {band.title} <span className="font-normal text-gray-400">· {band.members.length}</span>
                  </p>
                  {band.id !== 'off' && (
                    <button
                      type="button"
                      onClick={() => selectAll(band.members)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Pick all
                    </button>
                  )}
                </div>
                <ul className="mt-2 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200">
                  {band.members.map((w) => {
                    const here = onThisJob(w);
                    const checked = selected.has(w.worker.id) || here;
                    const status = here
                      ? { text: 'Already on this job', tone: 'text-gray-400' }
                      : w.assignment
                        ? {
                            text: `${checked ? 'Moves from' : 'On'} ${w.assignment.activity} · ${w.assignment.location}`,
                            tone: checked ? 'text-amber-700' : 'text-gray-500',
                          }
                        : w.status === 'free'
                          ? { text: w.today?.mark === 'half-day' ? 'Free · half day' : 'Free', tone: 'text-amber-700' }
                          : w.status === 'unmarked'
                            ? { text: 'Not marked yet', tone: 'text-gray-500' }
                            : { text: w.status === 'leave' ? 'On leave today' : 'Absent today', tone: 'text-red-600' };
                    return (
                      <li key={w.worker.id}>
                        <label
                          className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                            here ? 'cursor-default bg-gray-50' : checked ? 'cursor-pointer bg-amber-50/60' : 'cursor-pointer hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={here}
                            onChange={() => toggle(w.worker.id)}
                            className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                          />
                          <WorkerAvatar name={w.worker.name} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-gray-900">
                              {w.worker.name}
                              {w.worker.callingName && (
                                <span className="font-normal text-gray-400"> · {w.worker.callingName}</span>
                              )}
                            </span>
                            <span className="block truncate text-xs text-gray-400">
                              {getTrade(w.worker.trade).label} · {workerCode(w.worker.workerNo)}
                            </span>
                          </span>
                          <span className={`hidden max-w-[45%] truncate text-right text-xs sm:block ${status.tone}`}>
                            {status.text}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        {(moving.length > 0 || offChosen.length > 0) && (
          <div className="mt-6 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
            {moving.length > 0 && (
              <p className="flex items-start gap-2">
                <Icon name="arrowRightLeft" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {moving.length === 1 ? `${moving[0].worker.callingName ?? moving[0].worker.name} comes` : `${moving.length} workers come`}{' '}
                  off {[...new Set(moving.map((w) => w.assignment?.activity.toLowerCase()))].join(', ')}.
                </span>
              </p>
            )}
            {offChosen.length > 0 && (
              <p className="flex items-start gap-2">
                <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {offChosen.map((w) => w.worker.callingName ?? w.worker.name).join(', ')}{' '}
                  {offChosen.length === 1 ? 'is' : 'are'} off today - they’ll start when they’re back.
                </span>
              </p>
            )}
          </div>
        )}
      </form>
    </SlideOver>
  );
}

export default AllocateForm;
