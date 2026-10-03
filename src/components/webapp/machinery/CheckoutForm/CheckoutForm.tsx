import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Icon from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../../materials/SectionHeading/SectionHeading';
import { FormField, QuantityInput } from '../../materials/FormField/FormField';
import { accentButtonClass, inputClass, secondaryButtonClass } from '../../materials/formStyles';
import { addDays, newId, todayISO } from '../../../../utils/materials';
import type { CheckoutDraft, ToolStock } from '../../../../types/machinery';

/**
 * CheckoutForm
 *
 * Tool slip: tools leaving the store with a worker or gang. Only what's in
 * the store and fit to use can go out; the slip stays open until the tools
 * are checked back in.
 */
type LineDraft = { key: string; toolId: string; quantity: string };

type HeaderDraft = {
  issuedTo: string;
  workArea: string;
  checkedOutOn: string;
  dueBack: string;
};

type Errors = Record<string, string>;

type CheckoutFormProps = {
  tools: ToolStock[];
  people: string[];
  workAreas: string[];
  issuedBy: string;
  initialToolId?: string;
  onSubmit: (draft: CheckoutDraft) => void;
  onClose: () => void;
};

const num = (value: string) => (value.trim() === '' ? NaN : Number(value));

function CheckoutForm({
  tools,
  people,
  workAreas,
  issuedBy,
  initialToolId,
  onSubmit,
  onClose,
}: CheckoutFormProps) {
  const formId = useId();
  const listId = useId();
  const today = todayISO();

  const stockById = useMemo(() => new Map(tools.map((t) => [t.tool.id, t])), [tools]);
  const inStore = useMemo(
    () => tools.filter((t) => t.available > 0).sort((a, b) => a.tool.name.localeCompare(b.tool.name)),
    [tools],
  );

  const [header, setHeader] = useState<HeaderDraft>({
    issuedTo: '',
    workArea: '',
    checkedOutOn: today,
    dueBack: today,
  });
  const [lines, setLines] = useState<LineDraft[]>(() => [
    {
      key: newId(),
      toolId: initialToolId && stockById.get(initialToolId)?.available ? initialToolId : '',
      quantity: '',
    },
  ]);
  const [submitted, setSubmitted] = useState(false);

  const validate = (): Errors => {
    const errors: Errors = {};
    if (!header.issuedTo.trim()) errors.issuedTo = 'Who is taking them?';
    if (!header.workArea.trim()) errors.workArea = 'Where will they be used?';
    if (!header.checkedOutOn) errors.checkedOutOn = 'Enter the date.';
    else if (header.checkedOutOn > today) errors.checkedOutOn = 'Can’t be in the future.';
    if (!header.dueBack) errors.dueBack = 'When should they be back?';
    else if (header.checkedOutOn && header.dueBack < header.checkedOutOn) errors.dueBack = 'Before they go out.';

    lines.forEach((line) => {
      const k = (field: string) => `${line.key}-${field}`;
      const stock = stockById.get(line.toolId);
      if (!stock) {
        errors[k('tool')] = 'Choose a tool.';
        return;
      }
      const qty = num(line.quantity);
      if (!(qty > 0)) errors[k('quantity')] = 'How many?';
      else if (!Number.isInteger(qty)) errors[k('quantity')] = 'Whole pieces only.';
      else if (qty > stock.available) errors[k('quantity')] = `Only ${stock.available} in the store.`;
    });
    return errors;
  };

  const errors = submitted ? validate() : {};
  const hasErrors = Object.keys(errors).length > 0;

  const updateHeader = (patch: Partial<HeaderDraft>) => setHeader((prev) => ({ ...prev, ...patch }));
  const updateLine = (key: string, patch: Partial<LineDraft>) =>
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate()).length > 0) return;
    onSubmit({
      issuedTo: header.issuedTo.trim(),
      workArea: header.workArea.trim(),
      checkedOutOn: header.checkedOutOn,
      dueBack: header.dueBack,
      issuedBy,
      lines: lines.map((line) => ({ toolId: line.toolId, quantity: num(line.quantity) })),
    });
  };

  const pieces = lines.reduce((sum, l) => sum + (Number.isInteger(num(l.quantity)) ? num(l.quantity) : 0), 0);
  const quickDue = [
    { label: 'End of day', value: header.checkedOutOn || today },
    { label: 'Tomorrow', value: addDays(header.checkedOutOn || today, 1) },
    { label: 'In a week', value: addDays(header.checkedOutOn || today, 7) },
  ];

  return (
    <SlideOver
      open
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      eyebrow="Tool slip"
      title="Check out tools"
      description="Lend tools from the store to a worker or gang. They stay on the slip until checked back in."
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-semibold text-gray-900">
              {pieces} {pieces === 1 ? 'piece' : 'pieces'}
            </p>
            <p className="text-xs text-gray-400">Issued by {issuedBy}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
              Cancel
            </button>
            <button type="submit" form={formId} className={`${accentButtonClass} flex-1 sm:flex-none`}>
              <Icon name="arrowUpFromLine" className="h-4 w-4" />
              Check out
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            Some details are missing or more than the store holds - check the highlighted fields.
          </p>
        )}

        <SectionHeading title="Who and where" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Taken by" htmlFor="issuedTo" required error={errors.issuedTo} hint="Worker or gang leader">
            <input
              id="issuedTo"
              list={`${listId}-people`}
              value={header.issuedTo}
              onChange={(e) => updateHeader({ issuedTo: e.target.value })}
              placeholder="Name"
              aria-invalid={Boolean(errors.issuedTo)}
              className={inputClass}
            />
            <datalist id={`${listId}-people`}>
              {people.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Work area" htmlFor="workArea" required error={errors.workArea}>
            <input
              id="workArea"
              list={`${listId}-areas`}
              value={header.workArea}
              onChange={(e) => updateHeader({ workArea: e.target.value })}
              placeholder="e.g. Block B · Level 1 walls"
              aria-invalid={Boolean(errors.workArea)}
              className={inputClass}
            />
            <datalist id={`${listId}-areas`}>
              {workAreas.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Date out" htmlFor="checkedOutOn" required error={errors.checkedOutOn}>
            <input
              id="checkedOutOn"
              type="date"
              max={today}
              value={header.checkedOutOn}
              onChange={(e) => updateHeader({ checkedOutOn: e.target.value })}
              aria-invalid={Boolean(errors.checkedOutOn)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Due back" htmlFor="dueBack" required error={errors.dueBack}>
            <input
              id="dueBack"
              type="date"
              min={header.checkedOutOn}
              value={header.dueBack}
              onChange={(e) => updateHeader({ dueBack: e.target.value })}
              aria-invalid={Boolean(errors.dueBack)}
              className={inputClass}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {quickDue.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={header.dueBack === option.value}
                  onClick={() => updateHeader({ dueBack: option.value })}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                    header.dueBack === option.value
                      ? 'border-amber-400 bg-amber-50 font-semibold text-gray-900'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </FormField>
        </div>

        <SectionHeading title="Tools" aside="From what’s in the store" className="mt-8" />
        <ol className="mt-4 space-y-3">
          {lines.map((line) => {
            const k = (field: string) => `${line.key}-${field}`;
            const stock = stockById.get(line.toolId);
            const takenElsewhere = new Set(lines.filter((l) => l.key !== line.key).map((l) => l.toolId));
            return (
              <li
                key={line.key}
                className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-start"
              >
                <FormField label="Tool" htmlFor={k('tool')} required error={errors[k('tool')]}>
                  <select
                    id={k('tool')}
                    value={line.toolId}
                    onChange={(e) => updateLine(line.key, { toolId: e.target.value, quantity: '' })}
                    aria-invalid={Boolean(errors[k('tool')])}
                    className={inputClass}
                  >
                    <option value="">Choose from the store…</option>
                    {inStore
                      .filter((t) => !takenElsewhere.has(t.tool.id))
                      .map((t) => (
                        <option key={t.tool.id} value={t.tool.id}>
                          {t.tool.name} ({t.tool.spec}) - {t.available} in store
                        </option>
                      ))}
                  </select>
                </FormField>
                <FormField
                  label="Quantity"
                  htmlFor={k('quantity')}
                  required
                  error={errors[k('quantity')]}
                  hint={stock ? `${stock.available} available` : undefined}
                >
                  <QuantityInput
                    id={k('quantity')}
                    value={line.quantity}
                    onChange={(value) => updateLine(line.key, { quantity: value })}
                    unit="pcs"
                    disabled={!stock}
                    error={errors[k('quantity')]}
                  />
                </FormField>
                {lines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                    aria-label="Remove tool"
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

        {lines.length < inStore.length && (
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, { key: newId(), toolId: '', quantity: '' }])}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-amber-400 hover:bg-amber-50/40 hover:text-gray-900"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add another tool
          </button>
        )}
      </form>
    </SlideOver>
  );
}

export default CheckoutForm;
