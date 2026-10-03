import { useId, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Icon from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../../materials/SectionHeading/SectionHeading';
import { FormField, QuantityInput } from '../../materials/FormField/FormField';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../../materials/formStyles';
import { FuelPicker } from '../FuelGauge/FuelGauge';
import {
  COMPANY_YARD,
  arrivalChecks,
  conditions,
  getMeterKind,
  machineCategories,
  machineTypes,
  meterKinds,
  rateBases,
  toolCategories,
  toolLocations,
} from '../../../../constants/machinery';
import { newId, todayISO } from '../../../../utils/materials';
import type {
  ArrivalCheckId,
  Condition,
  EquipmentReceiptDraft,
  FuelLevel,
  MachineCategoryId,
  MeterKind,
  Ownership,
  RateBasis,
  Tool,
  ToolCategoryId,
} from '../../../../types/machinery';

/**
 * ReceiveEquipmentForm
 *
 * Equipment received note for whatever has just come through the gate from
 * one owner. Each item is either a machine - recorded unit by unit with its
 * plate, meter, fuel, condition and arrival checks - or a number of tools,
 * which becomes a lot. A tool that isn't on the list yet can be added inline.
 */
const OTHER_TYPE = '__other';
const NEW_TOOL = '__new';

type ItemKind = 'machine' | 'tools';

type NewToolDraft = {
  name: string;
  spec: string;
  category: ToolCategoryId | '';
  location: string;
};

type LineDraft = {
  key: string;
  kind: ItemKind;
  // Machine
  typeLabel: string;
  otherType: string;
  otherCategory: MachineCategoryId | '';
  model: string;
  regNo: string;
  serialNo: string;
  operator: string;
  rateAmount: string;
  rateBasis: RateBasis;
  meter: MeterKind;
  meterIn: string;
  fuelIn: FuelLevel;
  conditionIn: Condition;
  dueBack: string;
  checks: ArrivalCheckId[];
  // Tools
  toolId: string;
  newTool: NewToolDraft;
  quantity: string;
  dailyRate: string;
  // Both
  remarks: string;
};

type HeaderDraft = {
  receivedOn: string;
  ownership: Ownership;
  owner: string;
  reference: string;
  vehicleNo: string;
  hireOrder: string;
};

type Errors = Record<string, string>;

type ReceiveEquipmentFormProps = {
  tools: Tool[];
  owners: string[];
  /** Plates and fleet numbers of machines already on site. */
  regNosOnSite: string[];
  receivedBy: string;
  initialToolId?: string;
  onAddTool: (draft: Omit<Tool, 'id'>) => Tool;
  onSubmit: (draft: EquipmentReceiptDraft) => void;
  onClose: () => void;
};

const emptyNewTool: NewToolDraft = { name: '', spec: '', category: '', location: 'Tool store' };

function blankLine(kind: ItemKind, toolId = ''): LineDraft {
  return {
    key: newId(),
    kind,
    typeLabel: '',
    otherType: '',
    otherCategory: '',
    model: '',
    regNo: '',
    serialNo: '',
    operator: '',
    rateAmount: '',
    rateBasis: 'day',
    meter: 'hours',
    meterIn: '',
    fuelIn: 4,
    conditionIn: 'good',
    dueBack: '',
    checks: [],
    toolId,
    newTool: emptyNewTool,
    quantity: '',
    dailyRate: '',
    remarks: '',
  };
}

const num = (value: string) => (value.trim() === '' ? NaN : Number(value));
const normalizeReg = (value: string) => value.trim().toUpperCase().replace(/\s+/g, ' ');

function validate(header: HeaderDraft, lines: LineDraft[], regNosOnSite: string[]): Errors {
  const errors: Errors = {};
  const today = todayISO();
  const onSite = new Set(regNosOnSite.map(normalizeReg));

  if (!header.receivedOn) errors.receivedOn = 'Enter the date it arrived.';
  else if (header.receivedOn > today) errors.receivedOn = 'Can’t be in the future.';
  if (!header.owner.trim()) errors.owner = header.ownership === 'hired' ? 'Who is it hired from?' : 'Where is it from?';
  if (!header.reference.trim()) errors.reference = 'Enter the delivery, hire or transfer note number.';
  if (lines.length === 0) errors.lines = 'Add at least one machine or tool.';

  const regsInForm = new Map<string, number>();
  lines.forEach((line) => {
    if (line.kind === 'machine' && line.regNo.trim()) {
      const reg = normalizeReg(line.regNo);
      regsInForm.set(reg, (regsInForm.get(reg) ?? 0) + 1);
    }
  });

  lines.forEach((line) => {
    const k = (field: string) => `${line.key}-${field}`;

    if (line.kind === 'machine') {
      if (!line.typeLabel) errors[k('type')] = 'Choose what kind of machine.';
      if (line.typeLabel === OTHER_TYPE) {
        if (!line.otherType.trim()) errors[k('otherType')] = 'Name the machine.';
        if (!line.otherCategory) errors[k('otherCategory')] = 'Pick a category.';
      }
      if (!line.model.trim()) errors[k('model')] = 'Enter the make and model.';
      const reg = normalizeReg(line.regNo);
      if (!reg) errors[k('regNo')] = 'Enter the plate or fleet number.';
      else if (onSite.has(reg)) errors[k('regNo')] = 'Already on site.';
      else if ((regsInForm.get(reg) ?? 0) > 1) errors[k('regNo')] = 'Entered twice on this note.';
      if (header.ownership === 'hired') {
        if (!(num(line.rateAmount) > 0)) errors[k('rate')] = 'Enter the hire rate.';
      }
      if (line.meter !== 'none' && !(num(line.meterIn) >= 0)) errors[k('meterIn')] = 'Read the meter.';
      if (line.dueBack && header.receivedOn && line.dueBack < header.receivedOn)
        errors[k('dueBack')] = 'Before it arrived.';
    } else {
      if (!line.toolId) errors[k('tool')] = 'Choose a tool.';
      if (line.toolId === NEW_TOOL) {
        if (!line.newTool.name.trim()) errors[k('newName')] = 'Name the tool.';
        if (!line.newTool.category) errors[k('newCategory')] = 'Pick a category.';
        if (!line.newTool.location.trim()) errors[k('newLocation')] = 'Where is it kept?';
      }
      const qty = num(line.quantity);
      if (!(qty > 0)) errors[k('quantity')] = 'How many?';
      else if (!Number.isInteger(qty)) errors[k('quantity')] = 'Whole pieces only.';
      if (line.dailyRate.trim() && !(num(line.dailyRate) >= 0)) errors[k('dailyRate')] = 'Enter a valid rate.';
    }
  });

  return errors;
}

/** Row of toggle buttons, one pressed. */
function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {options.map((option) => (
        <button
          key={String(option.id)}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === option.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ReceiveEquipmentForm({
  tools,
  owners,
  regNosOnSite,
  receivedBy,
  initialToolId,
  onAddTool,
  onSubmit,
  onClose,
}: ReceiveEquipmentFormProps) {
  const formId = useId();
  const listId = useId();
  const today = todayISO();

  const [header, setHeader] = useState<HeaderDraft>({
    receivedOn: today,
    ownership: 'hired',
    owner: '',
    reference: '',
    vehicleNo: '',
    hireOrder: '',
  });
  const [lines, setLines] = useState<LineDraft[]>(() => [
    initialToolId ? blankLine('tools', initialToolId) : blankLine('machine'),
  ]);
  const [submitted, setSubmitted] = useState(false);

  const errors = submitted ? validate(header, lines, regNosOnSite) : {};
  const hasErrors = Object.keys(errors).length > 0;
  const hired = header.ownership === 'hired';

  const groupedTypes = useMemo(
    () =>
      machineCategories.map((category) => ({
        ...category,
        items: machineTypes.filter((t) => t.category === category.id),
      })),
    [],
  );
  const groupedTools = useMemo(
    () =>
      toolCategories
        .map((category) => ({
          ...category,
          items: tools.filter((t) => t.category === category.id).sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .filter((group) => group.items.length > 0),
    [tools],
  );

  const machineCount = lines.filter((l) => l.kind === 'machine').length;
  const toolPieces = lines
    .filter((l) => l.kind === 'tools')
    .reduce((sum, l) => sum + (Number.isInteger(num(l.quantity)) ? num(l.quantity) : 0), 0);

  const updateHeader = (patch: Partial<HeaderDraft>) => setHeader((prev) => ({ ...prev, ...patch }));
  const updateLine = (key: string, patch: Partial<LineDraft>) =>
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  const updateNewTool = (key: string, patch: Partial<NewToolDraft>) =>
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, newTool: { ...line.newTool, ...patch } } : line)),
    );

  const setOwnership = (ownership: Ownership) =>
    setHeader((prev) => ({
      ...prev,
      ownership,
      // Company kit comes from the yard; clear the yard name when switching back to hire.
      owner: ownership === 'company' ? prev.owner || COMPANY_YARD : prev.owner === COMPANY_YARD ? '' : prev.owner,
    }));

  const pickType = (key: string, typeLabel: string) => {
    const known = machineTypes.find((t) => t.label === typeLabel);
    updateLine(key, { typeLabel, meter: known?.meter ?? 'hours', meterIn: '' });
  };

  const toggleCheck = (key: string, id: ArrivalCheckId) =>
    setLines((prev) =>
      prev.map((line) =>
        line.key === key
          ? { ...line, checks: line.checks.includes(id) ? line.checks.filter((c) => c !== id) : [...line.checks, id] }
          : line,
      ),
    );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(header, lines, regNosOnSite)).length > 0) return;

    const machineLines = lines.filter((l) => l.kind === 'machine');
    const toolLines = lines.filter((l) => l.kind === 'tools');

    onSubmit({
      receivedOn: header.receivedOn,
      ownership: header.ownership,
      owner: header.owner.trim(),
      reference: header.reference.trim(),
      vehicleNo: header.vehicleNo.trim() || undefined,
      hireOrder: hired ? header.hireOrder.trim() || undefined : undefined,
      receivedBy,
      machines: machineLines.map((line) => {
        const known = machineTypes.find((t) => t.label === line.typeLabel);
        return {
          type: known ? known.label : line.otherType.trim(),
          category: known ? known.category : (line.otherCategory as MachineCategoryId),
          model: line.model.trim(),
          regNo: normalizeReg(line.regNo),
          serialNo: line.serialNo.trim() || undefined,
          operator: line.operator.trim() || undefined,
          rate: hired ? { amount: num(line.rateAmount), basis: line.rateBasis } : undefined,
          meter: line.meter,
          meterIn: line.meter !== 'none' ? num(line.meterIn) : undefined,
          fuelIn: line.fuelIn,
          conditionIn: line.conditionIn,
          checks: arrivalChecks.map((c) => c.id).filter((id) => line.checks.includes(id)),
          dueBack: line.dueBack || undefined,
          remarks: line.remarks.trim() || undefined,
        };
      }),
      tools: toolLines.map((line) => {
        let toolId = line.toolId;
        if (toolId === NEW_TOOL) {
          toolId = onAddTool({
            name: line.newTool.name.trim(),
            spec: line.newTool.spec.trim(),
            category: line.newTool.category as ToolCategoryId,
            location: line.newTool.location.trim(),
          }).id;
        }
        return {
          toolId,
          quantity: num(line.quantity),
          dailyRate: hired && line.dailyRate.trim() ? num(line.dailyRate) : undefined,
          remarks: line.remarks.trim() || undefined,
        };
      }),
    });
  };

  const summaryParts = [
    machineCount && `${machineCount} ${machineCount === 1 ? 'machine' : 'machines'}`,
    toolPieces && `${toolPieces} ${toolPieces === 1 ? 'tool' : 'tools'}`,
  ].filter(Boolean);

  return (
    <SlideOver
      open
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      eyebrow="Equipment received note"
      title="Receive equipment"
      description="Record machines and tools arriving on site - hired, or sent from the company yard."
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-semibold text-gray-900">{summaryParts.length ? summaryParts.join(' · ') : 'Nothing yet'}</p>
            <p className="text-xs text-gray-400">Received by {receivedBy}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
              Cancel
            </button>
            <button type="submit" form={formId} className={`${primaryButtonClass} flex-1 sm:flex-none`}>
              <Icon name="arrowDownToLine" className="h-4 w-4" />
              Record arrival
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errors.lines ?? 'Some details are missing or don’t add up - check the highlighted fields.'}
          </p>
        )}

        {/* Arrival */}
        <SectionHeading title="Arrival" />
        <div className="mt-4">
          <Segmented
            label="Ownership"
            value={header.ownership}
            onChange={setOwnership}
            options={[
              { id: 'hired', label: 'Hired in' },
              { id: 'company', label: 'Company-owned' },
            ]}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField
            label={hired ? 'Hired from' : 'Sent from'}
            htmlFor="owner"
            required
            error={errors.owner}
          >
            <input
              id="owner"
              list={`${listId}-owners`}
              value={header.owner}
              onChange={(e) => updateHeader({ owner: e.target.value })}
              placeholder={hired ? 'Plant hire company' : 'Yard or another site'}
              aria-invalid={Boolean(errors.owner)}
              className={inputClass}
            />
            <datalist id={`${listId}-owners`}>
              {(hired ? owners.filter((o) => o !== COMPANY_YARD) : [COMPANY_YARD]).map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Date arrived" htmlFor="receivedOn" required error={errors.receivedOn}>
            <input
              id="receivedOn"
              type="date"
              max={today}
              value={header.receivedOn}
              onChange={(e) => updateHeader({ receivedOn: e.target.value })}
              aria-invalid={Boolean(errors.receivedOn)}
              className={inputClass}
            />
          </FormField>
          <FormField
            label={hired ? 'Delivery / hire agreement no.' : 'Transfer note no.'}
            htmlFor="reference"
            required
            error={errors.reference}
          >
            <input
              id="reference"
              value={header.reference}
              onChange={(e) => updateHeader({ reference: e.target.value })}
              placeholder="As printed on the note"
              aria-invalid={Boolean(errors.reference)}
              className={inputClass}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Vehicle no." htmlFor="vehicleNo" hint="Low-bed or lorry">
              <input
                id="vehicleNo"
                value={header.vehicleNo}
                onChange={(e) => updateHeader({ vehicleNo: e.target.value })}
                placeholder="Optional"
                className={inputClass}
              />
            </FormField>
            {hired && (
              <FormField label="Hire order no." htmlFor="hireOrder">
                <input
                  id="hireOrder"
                  value={header.hireOrder}
                  onChange={(e) => updateHeader({ hireOrder: e.target.value })}
                  placeholder="Optional"
                  className={inputClass}
                />
              </FormField>
            )}
          </div>
        </div>

        {/* Items */}
        <SectionHeading title="What arrived" aside="Machines one by one, tools by count" className="mt-8" />
        <datalist id={`${listId}-locations`}>
          {toolLocations.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>

        <ol className="mt-4 space-y-4">
          {lines.map((line, index) => {
            const id = (field: string) => `${line.key}-${field}`;
            const meter = getMeterKind(line.meter);
            const checksDone = line.checks.length;

            return (
              <li key={line.key} className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-gray-900">Item {index + 1}</p>
                    <Segmented
                      label="Item kind"
                      value={line.kind}
                      onChange={(kind) => updateLine(line.key, { kind })}
                      options={[
                        {
                          id: 'machine',
                          label: (
                            <>
                              <Icon name="tractor" className="h-4 w-4" /> Machine
                            </>
                          ),
                        },
                        {
                          id: 'tools',
                          label: (
                            <>
                              <Icon name="hammer" className="h-4 w-4" /> Tools
                            </>
                          ),
                        },
                      ]}
                    />
                  </div>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Icon name="trash" className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>

                {line.kind === 'machine' ? (
                  <>
                    {/* Identity */}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <FormField label="Machine" htmlFor={id('type')} required error={errors[id('type')]}>
                        <select
                          id={id('type')}
                          value={line.typeLabel}
                          onChange={(e) => pickType(line.key, e.target.value)}
                          aria-invalid={Boolean(errors[id('type')])}
                          className={inputClass}
                        >
                          <option value="">Choose a machine…</option>
                          {groupedTypes.map((group) => (
                            <optgroup key={group.id} label={group.label}>
                              {group.items.map((t) => (
                                <option key={t.label} value={t.label}>
                                  {t.label}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                          <option value={OTHER_TYPE}>Other (not listed)</option>
                        </select>
                      </FormField>
                      <FormField label="Make & model" htmlFor={id('model')} required error={errors[id('model')]}>
                        <input
                          id={id('model')}
                          value={line.model}
                          onChange={(e) => updateLine(line.key, { model: e.target.value })}
                          placeholder="e.g. JCB 3CX"
                          aria-invalid={Boolean(errors[id('model')])}
                          className={inputClass}
                        />
                      </FormField>
                    </div>

                    {line.typeLabel === OTHER_TYPE && (
                      <div className="mt-4 grid gap-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-4 sm:grid-cols-2">
                        <FormField label="Machine name" htmlFor={id('otherType')} required error={errors[id('otherType')]}>
                          <input
                            id={id('otherType')}
                            value={line.otherType}
                            onChange={(e) => updateLine(line.key, { otherType: e.target.value })}
                            placeholder="e.g. Pile driving rig"
                            aria-invalid={Boolean(errors[id('otherType')])}
                            className={inputClass}
                          />
                        </FormField>
                        <FormField label="Category" htmlFor={id('otherCategory')} required error={errors[id('otherCategory')]}>
                          <select
                            id={id('otherCategory')}
                            value={line.otherCategory}
                            onChange={(e) =>
                              updateLine(line.key, { otherCategory: e.target.value as MachineCategoryId })
                            }
                            aria-invalid={Boolean(errors[id('otherCategory')])}
                            className={inputClass}
                          >
                            <option value="">Choose…</option>
                            {machineCategories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </FormField>
                      </div>
                    )}

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <FormField
                        label="Plate / fleet no."
                        htmlFor={id('regNo')}
                        required
                        error={errors[id('regNo')]}
                      >
                        <input
                          id={id('regNo')}
                          value={line.regNo}
                          onChange={(e) => updateLine(line.key, { regNo: e.target.value })}
                          placeholder="e.g. WP KA-4471"
                          aria-invalid={Boolean(errors[id('regNo')])}
                          className={`${inputClass} uppercase placeholder:normal-case`}
                        />
                      </FormField>
                      <FormField label="Serial / chassis no." htmlFor={id('serialNo')}>
                        <input
                          id={id('serialNo')}
                          value={line.serialNo}
                          onChange={(e) => updateLine(line.key, { serialNo: e.target.value })}
                          placeholder="Optional"
                          className={inputClass}
                        />
                      </FormField>
                      <FormField label="Operator" htmlFor={id('operator')} hint="If it comes with one">
                        <input
                          id={id('operator')}
                          value={line.operator}
                          onChange={(e) => updateLine(line.key, { operator: e.target.value })}
                          placeholder="Name"
                          className={inputClass}
                        />
                      </FormField>
                    </div>

                    {/* Hire */}
                    {hired && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                        <FormField label="Hire rate (Rs.)" htmlFor={id('rate')} required error={errors[id('rate')]}>
                          <QuantityInput
                            id={id('rate')}
                            value={line.rateAmount}
                            onChange={(value) => updateLine(line.key, { rateAmount: value })}
                            unit={`/ ${rateBases.find((b) => b.id === line.rateBasis)?.per}`}
                            step={1}
                            error={errors[id('rate')]}
                          />
                        </FormField>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Charged</p>
                          <div className="mt-1.5">
                            <Segmented
                              label="Rate basis"
                              value={line.rateBasis}
                              onChange={(rateBasis) => updateLine(line.key, { rateBasis })}
                              options={rateBases.map((b) => ({ id: b.id, label: b.label }))}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Condition at the gate */}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2">
                        <FormField label="Meter" htmlFor={id('meter')}>
                          <select
                            id={id('meter')}
                            value={line.meter}
                            onChange={(e) => updateLine(line.key, { meter: e.target.value as MeterKind, meterIn: '' })}
                            className={inputClass}
                          >
                            {meterKinds.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.label}
                              </option>
                            ))}
                          </select>
                        </FormField>
                        <FormField
                          label="Reading in"
                          htmlFor={id('meterIn')}
                          required={line.meter !== 'none'}
                          error={errors[id('meterIn')]}
                        >
                          <QuantityInput
                            id={id('meterIn')}
                            value={line.meterIn}
                            onChange={(value) => updateLine(line.key, { meterIn: value })}
                            unit={meter.short}
                            step={0.1}
                            disabled={line.meter === 'none'}
                            placeholder={line.meter === 'none' ? '-' : '0'}
                            error={errors[id('meterIn')]}
                          />
                        </FormField>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Fuel in</p>
                        <div className="mt-1.5">
                          <FuelPicker
                            name={id('fuel')}
                            value={line.fuelIn}
                            onChange={(fuelIn) => updateLine(line.key, { fuelIn })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Condition</p>
                        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                          {conditions.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              aria-pressed={line.conditionIn === c.id}
                              onClick={() => updateLine(line.key, { conditionIn: c.id })}
                              className={`rounded-lg border px-2 py-1.5 text-left transition-colors ${
                                line.conditionIn === c.id
                                  ? c.id === 'poor'
                                    ? 'border-red-400 bg-red-50'
                                    : 'border-blue-600 bg-blue-50/50'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <span className="block text-sm font-semibold text-gray-900">{c.label}</span>
                              <span className="block text-xs text-gray-500">{c.hint}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <FormField
                        label={hired ? 'Off-hire date' : 'Return to yard by'}
                        htmlFor={id('dueBack')}
                        error={errors[id('dueBack')]}
                        hint="Optional - flags it when it’s due"
                      >
                        <input
                          id={id('dueBack')}
                          type="date"
                          min={header.receivedOn}
                          value={line.dueBack}
                          onChange={(e) => updateLine(line.key, { dueBack: e.target.value })}
                          aria-invalid={Boolean(errors[id('dueBack')])}
                          className={inputClass}
                        />
                      </FormField>
                    </div>

                    {/* Checks */}
                    <fieldset className="mt-4 rounded-xl bg-gray-50 p-3.5">
                      <legend className="sr-only">Arrival checks</legend>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-medium text-gray-700">Arrival checks</p>
                        <p className={`text-xs ${checksDone === arrivalChecks.length ? 'text-blue-700' : 'text-gray-400'}`}>
                          {checksDone} of {arrivalChecks.length} confirmed
                        </p>
                      </div>
                      <div className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                        {arrivalChecks.map((check) => (
                          <label key={check.id} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={line.checks.includes(check.id)}
                              onChange={() => toggleCheck(line.key, check.id)}
                              className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                            />
                            {check.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <FormField label="Remarks" htmlFor={id('remarks')} className="mt-4">
                      <input
                        id={id('remarks')}
                        value={line.remarks}
                        onChange={(e) => updateLine(line.key, { remarks: e.target.value })}
                        placeholder="e.g. Scratches on boom, bucket teeth worn"
                        className={inputClass}
                      />
                    </FormField>
                  </>
                ) : (
                  <>
                    <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
                      <FormField label="Tool" htmlFor={id('tool')} required error={errors[id('tool')]}>
                        <select
                          id={id('tool')}
                          value={line.toolId}
                          onChange={(e) => updateLine(line.key, { toolId: e.target.value, newTool: emptyNewTool })}
                          aria-invalid={Boolean(errors[id('tool')])}
                          className={inputClass}
                        >
                          <option value="">Choose a tool…</option>
                          <option value={NEW_TOOL}>+ New tool (not on the list yet)</option>
                          {groupedTools.map((group) => (
                            <optgroup key={group.id} label={group.label}>
                              {group.items.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name} - {t.spec}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </FormField>
                      <FormField label="Quantity" htmlFor={id('quantity')} required error={errors[id('quantity')]}>
                        <QuantityInput
                          id={id('quantity')}
                          value={line.quantity}
                          onChange={(value) => updateLine(line.key, { quantity: value })}
                          unit="pcs"
                          error={errors[id('quantity')]}
                        />
                      </FormField>
                    </div>

                    {line.toolId === NEW_TOOL && (
                      <div className="mt-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-4">
                        <p className="text-sm font-semibold text-blue-700">New tool</p>
                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                          <FormField label="Name" htmlFor={id('newName')} required error={errors[id('newName')]}>
                            <input
                              id={id('newName')}
                              value={line.newTool.name}
                              onChange={(e) => updateNewTool(line.key, { name: e.target.value })}
                              placeholder="e.g. Crowbar"
                              aria-invalid={Boolean(errors[id('newName')])}
                              className={inputClass}
                            />
                          </FormField>
                          <FormField label="Size / rating" htmlFor={id('newSpec')}>
                            <input
                              id={id('newSpec')}
                              value={line.newTool.spec}
                              onChange={(e) => updateNewTool(line.key, { spec: e.target.value })}
                              placeholder="e.g. 1.5 m, hex bar"
                              className={inputClass}
                            />
                          </FormField>
                          <FormField label="Category" htmlFor={id('newCategory')} required error={errors[id('newCategory')]}>
                            <select
                              id={id('newCategory')}
                              value={line.newTool.category}
                              onChange={(e) => updateNewTool(line.key, { category: e.target.value as ToolCategoryId })}
                              aria-invalid={Boolean(errors[id('newCategory')])}
                              className={inputClass}
                            >
                              <option value="">Choose…</option>
                              {toolCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </FormField>
                          <FormField label="Kept in" htmlFor={id('newLocation')} required error={errors[id('newLocation')]}>
                            <input
                              id={id('newLocation')}
                              list={`${listId}-locations`}
                              value={line.newTool.location}
                              onChange={(e) => updateNewTool(line.key, { location: e.target.value })}
                              aria-invalid={Boolean(errors[id('newLocation')])}
                              className={inputClass}
                            />
                          </FormField>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {hired && (
                        <FormField
                          label="Hire per piece (Rs.)"
                          htmlFor={id('dailyRate')}
                          error={errors[id('dailyRate')]}
                          hint="Leave blank if it’s a lump sum"
                        >
                          <QuantityInput
                            id={id('dailyRate')}
                            value={line.dailyRate}
                            onChange={(value) => updateLine(line.key, { dailyRate: value })}
                            unit="/ day"
                            step={0.01}
                            placeholder="Optional"
                            error={errors[id('dailyRate')]}
                          />
                        </FormField>
                      )}
                      <FormField label="Remarks" htmlFor={id('remarks')} className={hired ? '' : 'sm:col-span-2'}>
                        <input
                          id={id('remarks')}
                          value={line.remarks}
                          onChange={(e) => updateLine(line.key, { remarks: e.target.value })}
                          placeholder="e.g. 2 with bent braces"
                          className={inputClass}
                        />
                      </FormField>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, blankLine('machine')])}
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add a machine
          </button>
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, blankLine('tools')])}
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add tools
          </button>
        </div>
      </form>
    </SlideOver>
  );
}

export default ReceiveEquipmentForm;
