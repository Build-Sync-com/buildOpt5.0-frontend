import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import Icon from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../../materials/SectionHeading/SectionHeading';
import { FormField, QuantityInput } from '../../materials/FormField/FormField';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../../materials/formStyles';
import { getTrade, trades } from '../../../../constants/labor';
import { MAX_WORKERS_PER_LINE } from '../../../../constants/taskRequests';
import { formatLaborLines, totalWorkers } from '../../../../utils/taskRequests';
import { formatDayMonth, newId, todayISO } from '../../../../utils/materials';
import type { TradeId } from '../../../../types/labor';
import type { ProgramNode, Schedule } from '../../../../types/program';
import type { LaborRequestDraft, LaborRequestLine } from '../../../../types/taskRequests';

/**
 * LaborRequestForm
 *
 * Asks for workers for one sub-task: how many of each trade, and for which
 * days. The days start out as the sub-task's planned dates (from today, if
 * it's already under way).
 */
type LaborRequestFormProps = {
  task: ProgramNode;
  path: string[];
  schedule?: Schedule;
  requestedBy: string;
  onSubmit: (draft: LaborRequestDraft) => void;
  onClose: () => void;
};

type LineDraft = { key: string; trade: TradeId | ''; workers: string };

type Errors = Record<string, string>;

const num = (value: string) => (value.trim() === '' ? NaN : Number(value));

function LaborRequestForm({ task, path, schedule, requestedBy, onSubmit, onClose }: LaborRequestFormProps) {
  const formId = useId();
  const today = todayISO();
  const planStart = schedule?.start ?? today;
  const planFinish = schedule?.finish ?? planStart;
  const defaultFrom = planStart > today ? planStart : today;

  const [neededFrom, setNeededFrom] = useState(defaultFrom);
  const [neededTo, setNeededTo] = useState(planFinish > defaultFrom ? planFinish : defaultFrom);
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<LineDraft[]>(() => [{ key: newId(), trade: '', workers: '' }]);
  const [submitted, setSubmitted] = useState(false);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!neededFrom) e.neededFrom = 'Enter the date.';
    else if (neededFrom < today) e.neededFrom = 'Can’t be in the past.';
    if (!neededTo) e.neededTo = 'Enter the date.';
    else if (neededFrom && neededTo < neededFrom) e.neededTo = 'Before the start.';
    lines.forEach((line) => {
      if (!line.trade) e[`${line.key}-trade`] = 'Choose a trade.';
      const n = num(line.workers);
      if (!(n > 0)) e[`${line.key}-workers`] = 'How many?';
      else if (!Number.isInteger(n)) e[`${line.key}-workers`] = 'Whole workers only.';
      else if (n > MAX_WORKERS_PER_LINE) e[`${line.key}-workers`] = `No more than ${MAX_WORKERS_PER_LINE}.`;
    });
    return e;
  };

  const errors = submitted ? validate() : {};
  const hasErrors = Object.keys(errors).length > 0;

  const updateLine = (key: string, patch: Partial<LineDraft>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const validLines: LaborRequestLine[] = lines
    .filter((l) => l.trade && Number.isInteger(num(l.workers)) && num(l.workers) > 0)
    .map((l) => ({ trade: l.trade as TradeId, workers: num(l.workers) }));
  const outsidePlan =
    schedule?.start && schedule.finish && neededFrom && neededTo && (neededFrom > schedule.finish || neededTo < schedule.start);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate()).length > 0) return;
    onSubmit({
      taskId: task.id,
      lines: validLines,
      neededFrom,
      neededTo,
      note: note.trim() || undefined,
      requestedBy,
    });
  };

  const total = totalWorkers(validLines);
  const usedTrades = new Set(lines.map((l) => l.trade));

  return (
    <SlideOver
      open
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      eyebrow="Labour request"
      title={task.name}
      description={path.join(' · ')}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-gray-900">
              {total} {total === 1 ? 'worker' : 'workers'}
            </p>
            <p className="truncate text-xs text-gray-400">
              {validLines.length ? formatLaborLines(validLines) : `Requested by ${requestedBy}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
              Cancel
            </button>
            <button type="submit" form={formId} className={`${primaryButtonClass} flex-1 sm:flex-none`}>
              <Icon name="users" className="h-4 w-4" />
              Send request
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            Some details are missing - check the highlighted fields.
          </p>
        )}

        <SectionHeading title="Workers needed" />
        <ol className="mt-4 space-y-3">
          {lines.map((line) => {
            const k = (field: string) => `${line.key}-${field}`;
            return (
              <li
                key={line.key}
                className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-start"
              >
                <FormField
                  label="Trade"
                  htmlFor={k('trade')}
                  required
                  error={errors[k('trade')]}
                  hint={line.trade ? getTrade(line.trade).hint : undefined}
                >
                  <select
                    id={k('trade')}
                    value={line.trade}
                    onChange={(e) => updateLine(line.key, { trade: e.target.value as TradeId | '' })}
                    aria-invalid={Boolean(errors[k('trade')])}
                    className={inputClass}
                  >
                    <option value="">Choose a trade…</option>
                    {trades
                      .filter((t) => t.id === line.trade || !usedTrades.has(t.id))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                  </select>
                </FormField>
                <FormField label="Workers" htmlFor={k('workers')} required error={errors[k('workers')]}>
                  <QuantityInput
                    id={k('workers')}
                    value={line.workers}
                    onChange={(value) => updateLine(line.key, { workers: value })}
                    unit="workers"
                    error={errors[k('workers')]}
                  />
                </FormField>
                {lines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                    aria-label="Remove trade"
                    className="justify-self-end rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 sm:mt-6"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="hidden w-8 sm:block" />
                )}
              </li>
            );
          })}
        </ol>
        {lines.length < trades.length && (
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, { key: newId(), trade: '', workers: '' }])}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50/40 hover:text-gray-900"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add another trade
          </button>
        )}

        <SectionHeading
          title="When"
          aside={schedule?.start && schedule.finish ? `Planned ${formatDayMonth(schedule.start)} – ${formatDayMonth(schedule.finish)}` : undefined}
          className="mt-8"
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Needed from" htmlFor="lr-from" required error={errors.neededFrom}>
            <input
              id="lr-from"
              type="date"
              min={today}
              value={neededFrom}
              onChange={(e) => setNeededFrom(e.target.value)}
              aria-invalid={Boolean(errors.neededFrom)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Needed until" htmlFor="lr-to" required error={errors.neededTo}>
            <input
              id="lr-to"
              type="date"
              min={neededFrom || today}
              value={neededTo}
              onChange={(e) => setNeededTo(e.target.value)}
              aria-invalid={Boolean(errors.neededTo)}
              className={inputClass}
            />
          </FormField>
        </div>
        {outsidePlan && (
          <p className="mt-3 flex items-start gap-2 text-xs text-amber-800">
            <Icon name="triangleAlert" className="mt-px h-3.5 w-3.5 shrink-0" />
            These days are outside the sub-task’s planned dates.
          </p>
        )}

        <FormField label="Note" htmlFor="lr-note" className="mt-6" hint="Anything the labour side should know">
          <textarea
            id="lr-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Need masons experienced in fair-face brickwork"
            className={inputClass}
          />
        </FormField>
      </form>
    </SlideOver>
  );
}

export default LaborRequestForm;
