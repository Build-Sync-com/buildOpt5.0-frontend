import { useState } from 'react';
import type { ReactNode } from 'react';
import Icon from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../../materials/SectionHeading/SectionHeading';
import { FormField } from '../../materials/FormField/FormField';
import { accentButtonClass, inputClass, secondaryButtonClass } from '../../materials/formStyles';
import { MarkBadge, MarkSquare, WorkerAvatar, WorkerStatusBadge } from '../WorkerBadge/WorkerBadge';
import {
  // REQUIRED_PPE, ppeItems - commented-out sections (Safety)
  getGrade,
  getReleaseReason,
  getTrade,
  releaseReasons,
} from '../../../../constants/labor';
import { formatPhone, jobDay, workerCode } from '../../../../utils/labor';
import {
  addDays,
  daysBetween,
  // formatCurrency - commented-out sections (Employment & pay)
  formatDate,
  formatDayMonth,
  formatNumber,
  todayISO,
} from '../../../../utils/materials';
import type { ReleaseReason, WorkerRelease, WorkerSummary } from '../../../../types/labor';

/**
 * WorkerPanel
 *
 * One worker in detail. It opens on where they stand today - which job
 * they're on and since when, or that they're free - then their last two
 * weeks on the muster, this month's pay, the jobs they've been on, and
 * their personal, employment and safety details.
 */
type WorkerPanelProps = {
  summary: WorkerSummary | null;
  canManage: boolean;
  releasedBy: string;
  onClose: () => void;
  onAllocate: (workerId: string) => void;
  onFree: (assignmentId: string) => void;
  onEdit: (workerId: string) => void;
  onRelease: (workerId: string, release: WorkerRelease) => void;
};

const STRIP_DAYS = 14;

function Detail({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm break-words text-gray-900">{children}</dd>
    </div>
  );
}

/** The big card at the top: what they're doing today. */
function TodayCard({
  summary,
  canManage,
  onAllocate,
  onFree,
}: Pick<WorkerPanelProps, 'canManage' | 'onAllocate' | 'onFree'> & { summary: WorkerSummary }) {
  const { worker, status, assignment, today } = summary;
  const [confirmFree, setConfirmFree] = useState(false);

  if (worker.release) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Left site</p>
        <p className="mt-1 text-lg font-semibold text-gray-900">
          Released {formatDate(worker.release.releasedOn)}
        </p>
        <p className="mt-1 text-sm text-gray-600">
          {getReleaseReason(worker.release.reason).label}
          {worker.release.note && <> - {worker.release.note}</>}
        </p>
        <p className="mt-2 text-xs text-gray-400">
          Released by {worker.release.releasedBy} after{' '}
          {daysBetween(worker.joinedOn, worker.release.releasedOn) + 1} days on site
        </p>
      </div>
    );
  }

  const off = status === 'absent' || status === 'leave';
  const tone = off
    ? 'border-red-200 bg-red-50/70'
    : status === 'free'
      ? 'border-amber-300 bg-amber-50'
      : assignment
        ? 'border-blue-200 bg-blue-50/60'
        : 'border-dashed border-gray-300 bg-white';

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Today</p>
        <MarkBadge mark={today?.mark} />
      </div>

      {assignment ? (
        <>
          <p className="mt-2 text-sm text-gray-500">{off ? 'Allocated to' : 'Working on'}</p>
          <p className="text-xl font-bold tracking-tight text-gray-900">{assignment.activity}</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-600">
            <Icon name="mapPin" className="h-3.5 w-3.5 shrink-0" />
            {assignment.location}
          </p>
          <p className="mt-3 text-sm text-gray-500">
            Since {formatDayMonth(assignment.startedOn)} · day {jobDay(assignment.startedOn)}
            {assignment.expectedEnd && <> · target {formatDayMonth(assignment.expectedEnd)}</>}
          </p>
          {assignment.note && <p className="mt-2 text-sm text-gray-600">{assignment.note}</p>}
          {off && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs font-medium text-red-700">
              <Icon name="triangleAlert" className="mt-px h-3.5 w-3.5 shrink-0" />
              {status === 'leave' ? 'On leave' : 'Absent'} today - {assignment.activity.toLowerCase()} is a hand short.
            </p>
          )}
        </>
      ) : status === 'free' ? (
        <>
          <p className="mt-2 text-xl font-bold tracking-tight text-amber-900">Free</p>
          <p className="mt-0.5 text-sm text-amber-900/80">
            {today?.mark === 'half-day' ? 'Here for half a day' : 'Present today'} with no work allocated.
            {summary.history[0]?.endedOn && (
              <>
                {' '}
                Last on {summary.history[0].activity.toLowerCase()} until{' '}
                {formatDayMonth(summary.history[0].endedOn)}.
              </>
            )}
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 text-xl font-bold tracking-tight text-gray-900">No work allocated</p>
          <p className="mt-0.5 text-sm text-gray-500">
            {status === 'unmarked'
              ? 'Not on today’s muster yet - mark them present to allocate.'
              : status === 'leave'
                ? 'On leave today.'
                : 'Absent today.'}
          </p>
        </>
      )}

      {canManage && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onAllocate(worker.id)}
            className={`${assignment ? secondaryButtonClass : accentButtonClass} py-2`}
          >
            <Icon name="arrowRightLeft" className="h-4 w-4" />
            {assignment ? 'Move to another job' : 'Allocate work'}
          </button>
          {assignment &&
            (confirmFree ? (
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onFree(assignment.id);
                    setConfirmFree(false);
                  }}
                  className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Take off this job
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmFree(false)}
                  className="px-2 py-2 text-sm text-gray-500 hover:text-gray-900"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmFree(true)}
                className="px-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Mark free
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function ReleaseForm({
  summary,
  releasedBy,
  onCancel,
  onRelease,
}: {
  summary: WorkerSummary;
  releasedBy: string;
  onCancel: () => void;
  onRelease: WorkerPanelProps['onRelease'];
}) {
  const today = todayISO();
  const { worker } = summary;
  const [releasedOn, setReleasedOn] = useState(today);
  const [reason, setReason] = useState<ReleaseReason>('completed');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const dateError = !releasedOn
    ? 'Enter the date.'
    : releasedOn > today
      ? 'Can’t be in the future.'
      : releasedOn < worker.joinedOn
        ? 'Before they joined.'
        : undefined;
  const noteError = reason === 'other' && !note.trim() ? 'Say why.' : undefined;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (dateError || noteError) return;
        onRelease(worker.id, { releasedOn, reason, note: note.trim() || undefined, releasedBy });
      }}
    >
      <p className="text-sm font-semibold text-gray-900">Release {worker.callingName ?? worker.name} from site</p>
      <p className="text-xs text-gray-500">
        {summary.assignment
          ? `They come off ${summary.assignment.activity.toLowerCase()} and the register. Their history stays.`
          : 'They come off the register. Their history stays.'}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <FormField label="Last day" htmlFor="release-date" error={submitted ? dateError : undefined}>
          <input
            id="release-date"
            type="date"
            min={worker.joinedOn}
            max={today}
            value={releasedOn}
            onChange={(e) => setReleasedOn(e.target.value)}
            aria-invalid={Boolean(submitted && dateError)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Reason" htmlFor="release-reason">
          <select
            id="release-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as ReleaseReason)}
            className={inputClass}
          >
            {releaseReasons.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField
        label="Note"
        htmlFor="release-note"
        required={reason === 'other'}
        error={submitted ? noteError : undefined}
        className="mt-3"
      >
        <input
          id="release-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Sent to the Kelaniya site"
          aria-invalid={Boolean(submitted && noteError)}
          className={inputClass}
        />
      </FormField>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={`${secondaryButtonClass} py-2`}>
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
        >
          <Icon name="userMinus" className="h-4 w-4" />
          Release
        </button>
      </div>
    </form>
  );
}

function WorkerPanel({
  summary,
  canManage,
  releasedBy,
  onClose,
  onAllocate,
  onFree,
  onEdit,
  onRelease,
}: WorkerPanelProps) {
  const [releasing, setReleasing] = useState(false);
  if (!summary) return null;

  const { worker, month } = summary;
  const trade = getTrade(worker.trade);
  const today = todayISO();
  const byDate = new Map(summary.attendance.map((r) => [r.date, r]));
  const strip = Array.from({ length: STRIP_DAYS }, (_, i) => addDays(today, i - (STRIP_DAYS - 1)));
  const pastJobs = summary.history.filter((a) => a.endedOn);
  // Used by the commented-out sections (Employment & pay, Safety):
  // const missingPpe = REQUIRED_PPE.filter((id) => !worker.ppe.includes(id));
  // const daysOnSite = daysBetween(worker.joinedOn, worker.release?.releasedOn ?? today) + 1;

  return (
    <SlideOver
      open
      onClose={() => {
        setReleasing(false);
        onClose();
      }}
      eyebrow={`${trade.label} · ${getGrade(worker.grade).label}`}
      title={
        <span className="flex items-center gap-3">
          <WorkerAvatar name={worker.name} size="lg" muted={Boolean(worker.release)} />
          <span className="min-w-0">
            <span className="block">{worker.name}</span>
            <span className="mt-1 flex flex-wrap items-center gap-2 text-sm font-normal text-gray-500">
              {workerCode(worker.workerNo)}
              {worker.callingName && <span>· “{worker.callingName}”</span>}
              <WorkerStatusBadge status={summary.status} />
            </span>
          </span>
        </span>
      }
      footer={
        canManage &&
        !worker.release &&
        (releasing ? (
          <ReleaseForm
            key={worker.id}
            summary={summary}
            releasedBy={releasedBy}
            onCancel={() => setReleasing(false)}
            onRelease={(id, release) => {
              setReleasing(false);
              onRelease(id, release);
            }}
          />
        ) : (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => setReleasing(true)}
              className={`${secondaryButtonClass} text-red-700 hover:text-red-800`}
            >
              <Icon name="userMinus" className="h-4 w-4" />
              Release from site
            </button>
            <button type="button" onClick={() => onEdit(worker.id)} className={secondaryButtonClass}>
              <Icon name="pencil" className="h-4 w-4" />
              Edit details
            </button>
          </div>
        ))
      }
    >
      <TodayCard
        key={worker.id + (summary.assignment?.id ?? '')}
        summary={summary}
        canManage={canManage}
        onAllocate={onAllocate}
        onFree={onFree}
      />

      {/* Attendance */}
      <SectionHeading title="Attendance" aside={`Last ${STRIP_DAYS} days`} className="mt-8" />
      <ol className="mt-4 grid grid-cols-7 gap-1.5">
        {strip.map((date) => {
          const onSite = date >= worker.joinedOn && (!worker.release || date <= worker.release.releasedOn);
          const record = byDate.get(date);
          const weekday = new Date(`${date}T00:00`).toLocaleDateString('en-GB', { weekday: 'narrow' });
          return (
            <li key={date} className="text-center">
              {onSite ? (
                <MarkSquare
                  mark={record?.mark}
                  label={`${formatDate(date)}: ${record ? record.mark.replace('-', ' ') : 'not marked'}${
                    record?.otHours ? ` + ${record.otHours} hrs OT` : ''
                  }`}
                />
              ) : (
                <span className="block h-7 rounded-md bg-gray-50" title={`${formatDate(date)}: not on site`} />
              )}
              <span className={`mt-1 block text-[10px] ${date === today ? 'font-semibold text-blue-600' : 'text-gray-400'}`}>
                {date === today ? 'Today' : `${weekday} ${Number(date.slice(8))}`}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-sm text-gray-600">
        <span className="font-semibold text-gray-900">{formatNumber(month.daysWorked, 1)} days</span> worked this
        month
        {month.otHours > 0 && <> · {formatNumber(month.otHours, 1)} hrs overtime</>}
      </p>

      {/* Work history */}
      <SectionHeading
        title="Work history"
        aside={`${pastJobs.length} earlier ${pastJobs.length === 1 ? 'job' : 'jobs'}`}
        className="mt-8"
      />
      {summary.history.length ? (
        <ol className="mt-4">
          {summary.history.map((a) => {
            const open = !a.endedOn;
            const days = daysBetween(a.startedOn, a.endedOn ?? today) + 1;
            return (
              <li key={a.id} className="group relative flex gap-3 pb-4 last:pb-0">
                <span className="relative flex w-3 flex-col items-center pt-1.5">
                  <span
                    className={`relative z-10 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                      open ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                  <span
                    className="absolute top-4 bottom-0 border-l border-dashed border-gray-300 group-last:hidden"
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {a.activity}
                      <span className="font-normal text-gray-500"> · {a.location}</span>
                    </p>
                    <p className="shrink-0 text-xs text-gray-400">
                      {days} {days === 1 ? 'day' : 'days'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDayMonth(a.startedOn)} – {open ? 'now' : formatDayMonth(a.endedOn ?? '')} · {a.assignedBy}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-gray-500">Not allocated to any work yet.</p>
      )}

      {/* Personal */}
      <SectionHeading title="Personal" className="mt-8" />
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
        <Detail label="NIC">{worker.nic}</Detail>
        <Detail label="Date of birth">
          {formatDate(worker.birthDate)}
          <span className="text-gray-400"> · {summary.age} yrs</span>
        </Detail>
        <Detail label="Gender">{worker.gender === 'female' ? 'Female' : 'Male'}</Detail>
        <Detail label="Mobile">
          <a href={`tel:${worker.phone}`} className="text-blue-600 hover:text-blue-700">
            {formatPhone(worker.phone)}
          </a>
        </Detail>
        <Detail label="Address" wide>
          {worker.address}
        </Detail>
        <Detail label="Emergency contact" wide>
          {worker.emergencyName || worker.emergencyPhone ? (
            <>
              {worker.emergencyName}
              {worker.emergencyPhone && (
                <>
                  {worker.emergencyName && ' · '}
                  <a href={`tel:${worker.emergencyPhone}`} className="text-blue-600 hover:text-blue-700">
                    {formatPhone(worker.emergencyPhone)}
                  </a>
                </>
              )}
            </>
          ) : (
            <span className="text-amber-700">None given</span>
          )}
        </Detail>
        {worker.remarks && (
          <Detail label="Remarks" wide>
            {worker.remarks}
          </Detail>
        )}
      </dl>

      {/*
        Employment & pay and Safety - commented out for now. To bring them back,
        remove this comment and restore the imports and variables marked
        "commented-out sections" above.

      Employment & pay
      <SectionHeading title="Employment & pay" className="mt-8" />
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
        <Detail label="Employed">
          {worker.employment === 'direct' ? 'Directly by the company' : `Through ${worker.subcontractor}`}
        </Detail>
        <Detail label="Joined site">
          {formatDate(worker.joinedOn)}
          <span className="text-gray-400"> · {daysOnSite} days</span>
        </Detail>
        <Detail label="Day rate">{formatCurrency(worker.dayRate)}</Detail>
        <Detail label="Overtime">{formatCurrency(worker.otRate)} / hr</Detail>
      </dl>

      Safety
      <SectionHeading title="Safety" className="mt-8" />
      <ul className="mt-4 space-y-1.5 rounded-xl bg-gray-50 p-3.5">
        <li className="flex items-center gap-2 text-sm">
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              worker.inductedOn ? 'bg-blue-600 text-white' : 'border border-amber-400 bg-amber-50 text-amber-700'
            }`}
          >
            <Icon name={worker.inductedOn ? 'check' : 'x'} className="h-3 w-3" strokeWidth={2.5} />
          </span>
          <span className={worker.inductedOn ? 'text-gray-700' : 'font-medium text-amber-800'}>
            Site safety induction
          </span>
          <span className={`text-xs ${worker.inductedOn ? 'text-gray-400' : 'text-amber-700'}`}>
            {worker.inductedOn ? formatDate(worker.inductedOn) : 'Not given yet'}
          </span>
        </li>
        {ppeItems.map((item) => {
          const issued = worker.ppe.includes(item.id);
          const required = REQUIRED_PPE.includes(item.id);
          return (
            <li key={item.id} className="flex items-center gap-2 text-sm">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  issued
                    ? 'bg-blue-600 text-white'
                    : required
                      ? 'border border-amber-400 bg-amber-50 text-amber-700'
                      : 'border border-gray-300 text-gray-400'
                }`}
              >
                <Icon name={issued ? 'check' : 'x'} className="h-3 w-3" strokeWidth={2.5} />
              </span>
              <span className={issued ? 'text-gray-700' : required ? 'font-medium text-amber-800' : 'text-gray-500'}>
                {item.label}
              </span>
              {!issued && (
                <span className={`text-xs ${required ? 'text-amber-700' : 'text-gray-400'}`}>
                  {required ? 'Not issued' : 'Not issued · only for work at height'}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {(missingPpe.length > 0 || !worker.inductedOn) && !worker.release && (
        <p className="mt-3 flex items-start gap-2 text-xs text-amber-800">
          <Icon name="triangleAlert" className="mt-px h-3.5 w-3.5 shrink-0" />
          Shouldn’t start work until inducted and issued a helmet, boots and vest.
        </p>
      )}
      */}
    </SlideOver>
  );
}

export default WorkerPanel;
