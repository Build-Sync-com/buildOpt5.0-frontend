import { useId, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Icon from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../../materials/SectionHeading/SectionHeading';
import { FormField, QuantityInput } from '../../materials/FormField/FormField';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../../materials/formStyles';
import { machineCategories, machineTypes, toolCategories } from '../../../../constants/machinery';
import { MAX_MACHINES_PER_LINE } from '../../../../constants/taskRequests';
import { formatDayMonth, newId, todayISO } from '../../../../utils/materials';
import type { MachineSummary, ToolStock } from '../../../../types/machinery';
import type { ProgramNode, Schedule } from '../../../../types/program';
import type { EquipmentRequestDraft } from '../../../../types/taskRequests';

/**
 * EquipmentRequestForm
 *
 * Asks for machinery and equipment for one sub-task: machines by type (from
 * the fleet on site, or to be hired), tools from the tool store, or both,
 * for a span of days at a work area. Each line shows what the site has now
 * - asking for more is allowed; the rest gets hired.
 */
type EquipmentRequestFormProps = {
  task: ProgramNode;
  path: string[];
  schedule?: Schedule;
  machines: MachineSummary[];
  tools: ToolStock[];
  requestedBy: string;
  onSubmit: (draft: EquipmentRequestDraft) => void;
  onClose: () => void;
};

type MachineLineDraft = { key: string; machineType: string; units: string; withOperator: boolean };
type ToolLineDraft = { key: string; toolId: string; quantity: string };

type Errors = Record<string, string>;

const num = (value: string) => (value.trim() === '' ? NaN : Number(value));

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="justify-self-end rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 sm:mt-6"
    >
      <Icon name="trash" className="h-4 w-4" />
    </button>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50/40 hover:text-gray-900"
    >
      <Icon name="plus" className="h-4 w-4" />
      {children}
    </button>
  );
}

function EquipmentRequestForm({
  task,
  path,
  schedule,
  machines,
  tools,
  requestedBy,
  onSubmit,
  onClose,
}: EquipmentRequestFormProps) {
  const formId = useId();
  const today = todayISO();
  const planStart = schedule?.start ?? today;
  const planFinish = schedule?.finish ?? planStart;
  const defaultFrom = planStart > today ? planStart : today;

  // What's on site now, per machine type: units still here and how many are idle.
  const fleet = useMemo(() => {
    const map = new Map<string, { onSite: number; idle: number }>();
    machines
      .filter((m) => !m.returned)
      .forEach((m) => {
        const entry = map.get(m.machine.type) ?? { onSite: 0, idle: 0 };
        entry.onSite += 1;
        if (m.status === 'idle') entry.idle += 1;
        map.set(m.machine.type, entry);
      });
    return map;
  }, [machines]);
  const toolsById = useMemo(() => new Map(tools.map((t) => [t.tool.id, t])), [tools]);

  const [machineLines, setMachineLines] = useState<MachineLineDraft[]>([]);
  const [toolLines, setToolLines] = useState<ToolLineDraft[]>([]);
  const [neededFrom, setNeededFrom] = useState(defaultFrom);
  const [neededTo, setNeededTo] = useState(planFinish > defaultFrom ? planFinish : defaultFrom);
  const [workArea, setWorkArea] = useState([path[0], task.name].filter(Boolean).join(' · '));
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const validate = (): Errors => {
    const e: Errors = {};
    if (machineLines.length === 0 && toolLines.length === 0) e.lines = 'Add at least one machine or tool.';
    machineLines.forEach((l) => {
      if (!l.machineType) e[`${l.key}-type`] = 'Choose a machine.';
      const n = num(l.units);
      if (!(n > 0)) e[`${l.key}-units`] = 'How many?';
      else if (!Number.isInteger(n)) e[`${l.key}-units`] = 'Whole machines only.';
      else if (n > MAX_MACHINES_PER_LINE) e[`${l.key}-units`] = `No more than ${MAX_MACHINES_PER_LINE}.`;
    });
    toolLines.forEach((l) => {
      if (!toolsById.has(l.toolId)) e[`${l.key}-tool`] = 'Choose a tool.';
      const n = num(l.quantity);
      if (!(n > 0)) e[`${l.key}-quantity`] = 'How many?';
      else if (!Number.isInteger(n)) e[`${l.key}-quantity`] = 'Whole pieces only.';
    });
    if (!neededFrom) e.neededFrom = 'Enter the date.';
    else if (neededFrom < today) e.neededFrom = 'Can’t be in the past.';
    if (!neededTo) e.neededTo = 'Enter the date.';
    else if (neededFrom && neededTo < neededFrom) e.neededTo = 'Before the start.';
    if (!workArea.trim()) e.workArea = 'Where on site?';
    return e;
  };

  const errors = submitted ? validate() : {};
  const hasErrors = Object.keys(errors).length > 0;

  const updateMachine = (key: string, patch: Partial<MachineLineDraft>) =>
    setMachineLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const updateTool = (key: string, patch: Partial<ToolLineDraft>) =>
    setToolLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate()).length > 0) return;
    onSubmit({
      taskId: task.id,
      machines: machineLines.map((l) => ({ machineType: l.machineType, units: num(l.units), withOperator: l.withOperator })),
      tools: toolLines.map((l) => ({ toolId: l.toolId, quantity: num(l.quantity) })),
      neededFrom,
      neededTo,
      workArea: workArea.trim().replace(/\s+/g, ' '),
      note: note.trim() || undefined,
      requestedBy,
    });
  };

  const usedTypes = new Set(machineLines.map((l) => l.machineType));
  const usedTools = new Set(toolLines.map((l) => l.toolId));
  const machineCount = machineLines.reduce((sum, l) => sum + (num(l.units) > 0 ? num(l.units) : 0), 0);
  const toolCount = toolLines.reduce((sum, l) => sum + (num(l.quantity) > 0 ? num(l.quantity) : 0), 0);
  const outsidePlan =
    schedule?.start && schedule.finish && neededFrom && neededTo && (neededFrom > schedule.finish || neededTo < schedule.start);

  return (
    <SlideOver
      open
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      eyebrow="Machinery & equipment request"
      title={task.name}
      description={path.join(' · ')}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-gray-900">
              {[
                `${machineCount} ${machineCount === 1 ? 'machine' : 'machines'}`,
                `${toolCount} ${toolCount === 1 ? 'tool' : 'tools'}`,
              ].join(' · ')}
            </p>
            <p className="truncate text-xs text-gray-400">Requested by {requestedBy}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
              Cancel
            </button>
            <button type="submit" form={formId} className={`${primaryButtonClass} flex-1 sm:flex-none`}>
              <Icon name="cog" className="h-4 w-4" />
              Send request
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errors.lines && Object.keys(errors).length === 1
              ? errors.lines
              : 'Some details are missing - check the highlighted fields.'}
          </p>
        )}

        {/* Machines */}
        <SectionHeading title="Machines" aside="From the fleet on site, or hired" />
        {machineLines.length > 0 && (
          <ol className="mt-4 space-y-3">
            {machineLines.map((line) => {
              const k = (field: string) => `${line.key}-${field}`;
              const onSite = fleet.get(line.machineType);
              const units = num(line.units);
              const short = line.machineType && units > (onSite?.onSite ?? 0);
              return (
                <li
                  key={line.key}
                  className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-start"
                >
                  <FormField
                    label="Machine"
                    htmlFor={k('type')}
                    required
                    error={errors[k('type')]}
                    hint={
                      line.machineType && (
                        <span className={short ? 'text-amber-700' : undefined}>
                          {onSite
                            ? `${onSite.onSite} on site${onSite.idle ? ` · ${onSite.idle} idle` : ''}`
                            : 'None on site - will need hiring'}
                        </span>
                      )
                    }
                  >
                    <select
                      id={k('type')}
                      value={line.machineType}
                      onChange={(e) => updateMachine(line.key, { machineType: e.target.value })}
                      aria-invalid={Boolean(errors[k('type')])}
                      className={inputClass}
                    >
                      <option value="">Choose a machine…</option>
                      {machineCategories.map((c) => (
                        <optgroup key={c.id} label={c.label}>
                          {machineTypes
                            .filter((t) => t.category === c.id)
                            .filter((t) => t.label === line.machineType || !usedTypes.has(t.label))
                            .map((t) => (
                              <option key={t.label} value={t.label}>
                                {t.label}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Units" htmlFor={k('units')} required error={errors[k('units')]}>
                    <QuantityInput
                      id={k('units')}
                      value={line.units}
                      onChange={(value) => updateMachine(line.key, { units: value })}
                      error={errors[k('units')]}
                    />
                  </FormField>
                  <RemoveButton
                    label="Remove machine"
                    onClick={() => setMachineLines((prev) => prev.filter((l) => l.key !== line.key))}
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-3">
                    <input
                      type="checkbox"
                      checked={line.withOperator}
                      onChange={(e) => updateMachine(line.key, { withOperator: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    With an operator
                  </label>
                </li>
              );
            })}
          </ol>
        )}
        <AddButton
          onClick={() =>
            setMachineLines((prev) => [...prev, { key: newId(), machineType: '', units: '1', withOperator: true }])
          }
        >
          Add a machine
        </AddButton>

        {/* Tools */}
        <SectionHeading title="Tools" aside="From the tool store" className="mt-8" />
        {toolLines.length > 0 && (
          <ol className="mt-4 space-y-3">
            {toolLines.map((line) => {
              const k = (field: string) => `${line.key}-${field}`;
              const t = toolsById.get(line.toolId);
              const short = t && num(line.quantity) > t.available;
              return (
                <li
                  key={line.key}
                  className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-start"
                >
                  <FormField label="Tool" htmlFor={k('tool')} required error={errors[k('tool')]} hint={t?.tool.spec}>
                    <select
                      id={k('tool')}
                      value={line.toolId}
                      onChange={(e) => updateTool(line.key, { toolId: e.target.value })}
                      aria-invalid={Boolean(errors[k('tool')])}
                      className={inputClass}
                    >
                      <option value="">Choose a tool…</option>
                      {toolCategories.map((c) => (
                        <optgroup key={c.id} label={c.label}>
                          {tools
                            .filter((x) => x.tool.category === c.id)
                            .filter((x) => x.tool.id === line.toolId || !usedTools.has(x.tool.id))
                            .sort((a, b) => a.tool.name.localeCompare(b.tool.name))
                            .map((x) => (
                              <option key={x.tool.id} value={x.tool.id}>
                                {x.tool.name}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                  </FormField>
                  <FormField
                    label="Quantity"
                    htmlFor={k('quantity')}
                    required
                    error={errors[k('quantity')]}
                    hint={
                      t && (
                        <span className={short ? 'text-amber-700' : undefined}>
                          {t.available > 0 ? `${t.available} free in the store` : 'None free in the store'}
                        </span>
                      )
                    }
                  >
                    <QuantityInput
                      id={k('quantity')}
                      value={line.quantity}
                      onChange={(value) => updateTool(line.key, { quantity: value })}
                      unit="pcs"
                      disabled={!t}
                      error={errors[k('quantity')]}
                    />
                  </FormField>
                  <RemoveButton
                    label="Remove tool"
                    onClick={() => setToolLines((prev) => prev.filter((l) => l.key !== line.key))}
                  />
                </li>
              );
            })}
          </ol>
        )}
        {toolLines.length < tools.length && (
          <AddButton onClick={() => setToolLines((prev) => [...prev, { key: newId(), toolId: '', quantity: '' }])}>
            Add a tool
          </AddButton>
        )}

        {/* When and where */}
        <SectionHeading
          title="When & where"
          aside={
            schedule?.start && schedule.finish
              ? `Planned ${formatDayMonth(schedule.start)} – ${formatDayMonth(schedule.finish)}`
              : undefined
          }
          className="mt-8"
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Needed from" htmlFor="eq-from" required error={errors.neededFrom}>
            <input
              id="eq-from"
              type="date"
              min={today}
              value={neededFrom}
              onChange={(e) => setNeededFrom(e.target.value)}
              aria-invalid={Boolean(errors.neededFrom)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Needed until" htmlFor="eq-to" required error={errors.neededTo}>
            <input
              id="eq-to"
              type="date"
              min={neededFrom || today}
              value={neededTo}
              onChange={(e) => setNeededTo(e.target.value)}
              aria-invalid={Boolean(errors.neededTo)}
              className={inputClass}
            />
          </FormField>
          <FormField
            label="Work area"
            htmlFor="eq-area"
            required
            error={errors.workArea}
            hint="Where on site"
            className="sm:col-span-2"
          >
            <input
              id="eq-area"
              value={workArea}
              onChange={(e) => setWorkArea(e.target.value)}
              placeholder="e.g. Car park retaining wall"
              aria-invalid={Boolean(errors.workArea)}
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

        <FormField label="Note" htmlFor="eq-note" className="mt-6" hint="Anything the machinery side should know">
          <textarea
            id="eq-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Backhoe for half a day only - trenching for the drain line"
            className={inputClass}
          />
        </FormField>
      </form>
    </SlideOver>
  );
}

export default EquipmentRequestForm;
