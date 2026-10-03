import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import Icon from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../../materials/SectionHeading/SectionHeading';
import { FormField, QuantityInput } from '../../materials/FormField/FormField';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../../materials/formStyles';
import { formatDate, todayISO } from '../../../../utils/materials';
import type { Tool, ToolCheckIn, ToolCheckout } from '../../../../types/machinery';

/**
 * CheckInForm
 *
 * Closes a tool slip. Everything is assumed back in good order; the store
 * keeper only enters what came back damaged (kept out of use) or didn't come
 * back (written off).
 */
type CountDraft = { damaged: string; missing: string };

type CheckInFormProps = {
  checkout: ToolCheckout;
  tools: Tool[];
  receivedBy: string;
  onSubmit: (checkoutId: string, draft: ToolCheckIn) => void;
  onClose: () => void;
};

const count = (value: string) => (value.trim() === '' ? 0 : Number(value));

function CheckInForm({ checkout, tools, receivedBy, onSubmit, onClose }: CheckInFormProps) {
  const formId = useId();
  const today = todayISO();
  const toolById = new Map(tools.map((t) => [t.id, t]));

  const [returnedOn, setReturnedOn] = useState(today);
  const [note, setNote] = useState('');
  const [counts, setCounts] = useState<Record<string, CountDraft>>(() =>
    Object.fromEntries(checkout.lines.map((l) => [l.toolId, { damaged: '', missing: '' }])),
  );
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!returnedOn) errors.returnedOn = 'Enter the date.';
    else if (returnedOn > today) errors.returnedOn = 'Can’t be in the future.';
    else if (returnedOn < checkout.checkedOutOn) errors.returnedOn = 'Before they went out.';
    checkout.lines.forEach((line) => {
      const c = counts[line.toolId];
      const damaged = count(c.damaged);
      const missing = count(c.missing);
      if (!Number.isInteger(damaged) || damaged < 0) errors[`${line.toolId}-damaged`] = 'Whole pieces only.';
      if (!Number.isInteger(missing) || missing < 0) errors[`${line.toolId}-missing`] = 'Whole pieces only.';
      else if (damaged + missing > line.quantity)
        errors[`${line.toolId}-missing`] = `Only ${line.quantity} went out.`;
    });
    const anyIssue = checkout.lines.some((l) => count(counts[l.toolId].missing) > 0 || count(counts[l.toolId].damaged) > 0);
    if (anyIssue && !note.trim()) errors.note = 'Say what happened.';
    return errors;
  };

  const errors = submitted ? validate() : {};
  const hasErrors = Object.keys(errors).length > 0;

  const updateCount = (toolId: string, patch: Partial<CountDraft>) =>
    setCounts((prev) => ({ ...prev, [toolId]: { ...prev[toolId], ...patch } }));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate()).length > 0) return;
    onSubmit(checkout.id, {
      returnedOn,
      receivedBy,
      note: note.trim() || undefined,
      lines: checkout.lines.map((line) => ({
        toolId: line.toolId,
        damaged: count(counts[line.toolId].damaged),
        missing: count(counts[line.toolId].missing),
      })),
    });
  };

  const missingTotal = checkout.lines.reduce((sum, l) => sum + (count(counts[l.toolId].missing) || 0), 0);
  const damagedTotal = checkout.lines.reduce((sum, l) => sum + (count(counts[l.toolId].damaged) || 0), 0);

  return (
    <SlideOver
      open
      onClose={onClose}
      closeOnBackdrop={false}
      eyebrow={`Tool slip ${checkout.slipNo}`}
      title="Check in tools"
      description={`${checkout.issuedTo} · ${checkout.workArea} · out since ${formatDate(checkout.checkedOutOn)}`}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-semibold text-gray-900">
              {missingTotal || damagedTotal
                ? [missingTotal && `${missingTotal} missing`, damagedTotal && `${damagedTotal} damaged`]
                    .filter(Boolean)
                    .join(' · ')
                : 'All back in good order'}
            </p>
            <p className="text-xs text-gray-400">Received by {receivedBy}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
              Cancel
            </button>
            <button type="submit" form={formId} className={`${primaryButtonClass} flex-1 sm:flex-none`}>
              <Icon name="arrowDownToLine" className="h-4 w-4" />
              Check in
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            Some counts don’t add up - check the highlighted fields.
          </p>
        )}

        <FormField label="Date back" htmlFor="returnedOn" required error={errors.returnedOn} className="sm:w-1/2">
          <input
            id="returnedOn"
            type="date"
            min={checkout.checkedOutOn}
            max={today}
            value={returnedOn}
            onChange={(e) => setReturnedOn(e.target.value)}
            aria-invalid={Boolean(errors.returnedOn)}
            className={inputClass}
          />
        </FormField>

        <SectionHeading title="What came back" aside="Only enter the exceptions" className="mt-8" />
        <ul className="mt-4 space-y-3">
          {checkout.lines.map((line) => {
            const tool = toolById.get(line.toolId);
            const c = counts[line.toolId];
            const good = line.quantity - (count(c.damaged) || 0) - (count(c.missing) || 0);
            const k = (field: string) => `${line.toolId}-${field}`;
            return (
              <li key={line.toolId} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 truncate font-medium text-gray-900">
                    {tool?.name ?? 'Tool'} <span className="font-normal text-gray-400">· {line.quantity} out</span>
                  </p>
                  <p className={`shrink-0 text-sm font-semibold ${good === line.quantity ? 'text-blue-700' : 'text-gray-900'}`}>
                    {Math.max(0, good)} good
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <FormField label="Damaged" htmlFor={k('damaged')} error={errors[k('damaged')]} hint="Kept out of use">
                    <QuantityInput
                      id={k('damaged')}
                      value={c.damaged}
                      onChange={(value) => updateCount(line.toolId, { damaged: value })}
                      unit="pcs"
                      error={errors[k('damaged')]}
                    />
                  </FormField>
                  <FormField label="Missing" htmlFor={k('missing')} error={errors[k('missing')]} hint="Written off">
                    <QuantityInput
                      id={k('missing')}
                      value={c.missing}
                      onChange={(value) => updateCount(line.toolId, { missing: value })}
                      unit="pcs"
                      error={errors[k('missing')]}
                    />
                  </FormField>
                </div>
              </li>
            );
          })}
        </ul>

        <FormField
          label="Note"
          htmlFor="note"
          error={errors.note}
          required={missingTotal + damagedTotal > 0}
          className="mt-6"
        >
          <input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Grinder guard cracked; one trowel lost at Block B"
            aria-invalid={Boolean(errors.note)}
            className={inputClass}
          />
        </FormField>
      </form>
    </SlideOver>
  );
}

export default CheckInForm;
