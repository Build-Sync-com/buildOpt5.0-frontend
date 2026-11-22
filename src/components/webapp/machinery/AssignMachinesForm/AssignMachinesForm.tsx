import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Icon from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../../materials/SectionHeading/SectionHeading';
import { FormField } from '../../materials/FormField/FormField';
import { accentButtonClass, inputClass, secondaryButtonClass } from '../../materials/formStyles';
import { RegPlate } from '../FleetBoard/FleetBoard';
import { MachineStatusBadge } from '../StatusBadge/StatusBadge';
import { sameRequestRef } from '../../../../utils/taskRequests';
import { formatDayMonth, todayISO } from '../../../../utils/materials';
import type { MachineAssignment, MachineAssignmentDraft, MachineSummary } from '../../../../types/machinery';
import type { MachineFillLine } from '../../../../types/taskRequests';

/**
 * AssignMachinesForm
 *
 * Fills an equipment request's machine lines by putting machines from the
 * fleet on it. For each requested type it lists the units on site, with
 * what might get in the way - broken down, no operator when one's wanted,
 * already on another request on the same days, or due off hire before the
 * job ends. Those are warnings, not blocks: the machinery team decides.
 */
export type AssignRequest = {
  /** "EQ-701". */
  code: string;
  taskName: string;
  workArea: string;
  neededFrom: string;
  neededTo: string;
  machines: MachineFillLine[];
};

type AssignMachinesFormProps = {
  request: AssignRequest;
  machines: MachineSummary[];
  assignments: MachineAssignment[];
  assignedBy: string;
  onSubmit: (draft: MachineAssignmentDraft) => void;
  onClose: () => void;
};

type Errors = Partial<Record<'fromDate' | 'toDate' | 'machines', string>>;

function AssignMachinesForm({ request, machines, assignments, assignedBy, onSubmit, onClose }: AssignMachinesFormProps) {
  const formId = useId();
  const today = todayISO();
  const [fromDate, setFromDate] = useState(request.neededFrom > today ? request.neededFrom : today);
  const [toDate, setToDate] = useState(request.neededTo > today ? request.neededTo : today);
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [submitted, setSubmitted] = useState(false);

  const onRequest = useMemo(() => new Set(request.machines.flatMap((m) => m.machineIds)), [request.machines]);
  const onSite = useMemo(() => machines.filter((m) => !m.returned), [machines]);

  /** What might stop this machine doing the job on these days. */
  const warningsFor = (m: MachineSummary, withOperator: boolean): string[] => {
    const found: string[] = [];
    if (m.status === 'breakdown') found.push('Broken down');
    if (withOperator && !m.machine.operator) found.push('No operator on record');
    assignments
      .filter(
        (a) =>
          a.machineId === m.machine.id &&
          !sameRequestRef(a.requestRef, request.code) &&
          a.fromDate <= toDate &&
          a.toDate >= fromDate,
      )
      .forEach((a) => found.push(`Also on ${a.requestRef} · ${formatDayMonth(a.fromDate)} – ${formatDayMonth(a.toDate)}`));
    if (m.machine.dueBack && m.machine.dueBack < toDate) found.push(`Off-hire due ${formatDayMonth(m.machine.dueBack)}`);
    return found;
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!fromDate) e.fromDate = 'Enter the date.';
    else if (fromDate < today) e.fromDate = 'Can’t be in the past.';
    if (!toDate) e.toDate = 'Enter the date.';
    else if (fromDate && toDate < fromDate) e.toDate = 'Before the start.';
    if (picked.size === 0) e.machines = 'Pick at least one machine.';
    return e;
  };

  const errors = submitted ? validate() : {};
  const hasErrors = Object.keys(errors).length > 0;

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate()).length > 0) return;
    onSubmit({
      machineIds: [...picked],
      requestRef: request.code,
      fromDate,
      toDate,
      assignedBy,
      note: note.trim() || undefined,
      purpose: `${request.taskName} (${request.workArea})`,
    });
  };

  return (
    <SlideOver
      open
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      eyebrow={`Answering ${request.code}`}
      title="Assign machines"
      description={`${request.taskName} · ${request.workArea}`}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-semibold text-gray-900">
              {picked.size} {picked.size === 1 ? 'machine' : 'machines'}
            </p>
            <p className="text-xs text-gray-400">Assigned by {assignedBy}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
              Cancel
            </button>
            <button type="submit" form={formId} className={`${accentButtonClass} flex-1 sm:flex-none`}>
              <Icon name="tractor" className="h-4 w-4" />
              Assign
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errors.machines && Object.keys(errors).length === 1
              ? errors.machines
              : 'Some details are missing - check the highlighted fields.'}
          </p>
        )}

        {/* One group per requested machine type */}
        {request.machines.map((line) => {
          const candidates = onSite
            .filter((m) => m.machine.type === line.machineType)
            .sort((a, b) => Number(a.status === 'breakdown') - Number(b.status === 'breakdown'));
          const pickedHere = candidates.filter((m) => picked.has(m.machine.id)).length;
          const total = line.machineIds.length + pickedHere;
          const done = total >= line.requested;
          return (
            <section key={line.machineType} className="mb-8">
              <SectionHeading
                title={line.machineType}
                aside={`${total}/${line.requested}${line.withOperator ? ' · with operator' : ''}`}
              />
              {done && pickedHere === 0 && line.machineIds.length > 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-blue-700">
                  <Icon name="circleCheck" className="h-4 w-4" />
                  All assigned.
                </p>
              )}
              {candidates.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500">
                  No {line.machineType.toLowerCase()} on site. Receive or hire one first, then assign it here.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200">
                  {candidates.map((m) => {
                    const already = onRequest.has(m.machine.id);
                    const checked = already || picked.has(m.machine.id);
                    const warnings = already ? [] : warningsFor(m, line.withOperator);
                    return (
                      <li key={m.machine.id}>
                        <label
                          className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                            already
                              ? 'cursor-default bg-gray-50'
                              : checked
                                ? 'cursor-pointer bg-amber-50/60'
                                : 'cursor-pointer hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={already}
                            onChange={() => toggle(m.machine.id)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{m.machine.model}</span>
                              <RegPlate regNo={m.machine.regNo} />
                              <MachineStatusBadge status={m.status} />
                            </span>
                            <span className="mt-0.5 block text-xs text-gray-500">
                              {m.machine.operator ? `Operator ${m.machine.operator}` : 'No operator'} ·{' '}
                              {m.machine.owner}
                            </span>
                            {already && <span className="mt-1 block text-xs text-gray-400">Already on this request</span>}
                            {warnings.map((w) => (
                              <span key={w} className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-800">
                                <Icon name="triangleAlert" className="h-3.5 w-3.5 shrink-0" />
                                {w}
                              </span>
                            ))}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}

        <SectionHeading title="For" aside={`Requested ${formatDayMonth(request.neededFrom)} – ${formatDayMonth(request.neededTo)}`} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="From" htmlFor="as-from" required error={errors.fromDate}>
            <input
              id="as-from"
              type="date"
              min={today}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-invalid={Boolean(errors.fromDate)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Until" htmlFor="as-to" required error={errors.toDate}>
            <input
              id="as-to"
              type="date"
              min={fromDate || today}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-invalid={Boolean(errors.toDate)}
              className={inputClass}
            />
          </FormField>
        </div>
        <FormField label="Note" htmlFor="as-note" className="mt-4">
          <input
            id="as-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Move it across from Block B after lunch"
            className={inputClass}
          />
        </FormField>
      </form>
    </SlideOver>
  );
}

export default AssignMachinesForm;
