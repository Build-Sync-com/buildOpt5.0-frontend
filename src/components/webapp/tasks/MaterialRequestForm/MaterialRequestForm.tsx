import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Icon from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../../materials/SectionHeading/SectionHeading';
import { FormField, QuantityInput } from '../../materials/FormField/FormField';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../../materials/formStyles';
import { getUnit, materialCategories } from '../../../../constants/materials';
import { fitsUnit, formatDayMonth, formatQuantity, newId, todayISO, unitSuffix } from '../../../../utils/materials';
import type { MaterialStock } from '../../../../types/materials';
import type { ProgramNode, Schedule } from '../../../../types/program';
import type { MaterialRequestDraft } from '../../../../types/taskRequests';

/**
 * MaterialRequestForm
 *
 * Asks the store for materials for one sub-task: which materials from the
 * store's list and how much of each (in the material's own unit), where on
 * site to send them, and the date they're needed by. It shows what the store
 * holds now; asking for more is allowed - the store orders the rest.
 */
type MaterialRequestFormProps = {
  task: ProgramNode;
  path: string[];
  schedule?: Schedule;
  stock: MaterialStock[];
  requestedBy: string;
  onSubmit: (draft: MaterialRequestDraft) => void;
  onClose: () => void;
};

type LineDraft = { key: string; materialId: string; quantity: string };

type Errors = Record<string, string>;

const num = (value: string) => (value.trim() === '' ? NaN : Number(value));

function MaterialRequestForm({ task, path, schedule, stock, requestedBy, onSubmit, onClose }: MaterialRequestFormProps) {
  const formId = useId();
  const today = todayISO();
  const planStart = schedule?.start;
  // Materials should be on site before the work starts; if it's already under way, as soon as possible.
  const defaultNeededBy = planStart && planStart > today ? planStart : today;

  const stockById = useMemo(() => new Map(stock.map((s) => [s.material.id, s])), [stock]);
  const grouped = useMemo(
    () =>
      materialCategories
        .map((c) => ({
          ...c,
          items: stock
            .filter((s) => s.material.category === c.id)
            .sort((a, b) => a.material.name.localeCompare(b.material.name)),
        }))
        .filter((c) => c.items.length > 0),
    [stock],
  );

  const [neededBy, setNeededBy] = useState(defaultNeededBy);
  // Section and sub-task, e.g. "Block A · Brickwork - Level 3"; edit to the exact spot.
  const [deliverTo, setDeliverTo] = useState([path[0], task.name].filter(Boolean).join(' · '));
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<LineDraft[]>(() => [{ key: newId(), materialId: '', quantity: '' }]);
  const [submitted, setSubmitted] = useState(false);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!neededBy) e.neededBy = 'Enter the date.';
    else if (neededBy < today) e.neededBy = 'Can’t be in the past.';
    if (!deliverTo.trim()) e.deliverTo = 'Where should it go?';
    lines.forEach((line) => {
      const s = stockById.get(line.materialId);
      if (!s) {
        e[`${line.key}-material`] = 'Choose a material.';
        return;
      }
      const qty = num(line.quantity);
      const unit = getUnit(s.material.unit);
      if (!(qty > 0)) e[`${line.key}-quantity`] = 'How much?';
      else if (!fitsUnit(qty, s.material.unit)) {
        e[`${line.key}-quantity`] = unit.decimals === 0 ? `Whole ${unit.plural} only.` : `Up to ${unit.decimals} decimals.`;
      }
    });
    return e;
  };

  const errors = submitted ? validate() : {};
  const hasErrors = Object.keys(errors).length > 0;

  const updateLine = (key: string, patch: Partial<LineDraft>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate()).length > 0) return;
    onSubmit({
      taskId: task.id,
      lines: lines.map((l) => ({ materialId: l.materialId, quantity: num(l.quantity) })),
      neededBy,
      deliverTo: deliverTo.trim().replace(/\s+/g, ' '),
      note: note.trim() || undefined,
      requestedBy,
    });
  };

  const chosen = new Set(lines.map((l) => l.materialId));
  const shortLines = lines.filter((l) => {
    const s = stockById.get(l.materialId);
    return s && num(l.quantity) > s.onHand;
  }).length;
  const filled = lines.filter((l) => l.materialId && num(l.quantity) > 0).length;

  return (
    <SlideOver
      open
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      eyebrow="Material request"
      title={task.name}
      description={path.join(' · ')}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-gray-900">
              {filled} {filled === 1 ? 'material' : 'materials'}
            </p>
            <p className="truncate text-xs text-gray-400">
              {shortLines
                ? `${shortLines} more than the store holds - it’ll be ordered`
                : `Requested by ${requestedBy}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
              Cancel
            </button>
            <button type="submit" form={formId} className={`${primaryButtonClass} flex-1 sm:flex-none`}>
              <Icon name="package" className="h-4 w-4" />
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

        <SectionHeading title="Materials" aside="From the store’s list" />
        <ol className="mt-4 space-y-3">
          {lines.map((line) => {
            const k = (field: string) => `${line.key}-${field}`;
            const s = stockById.get(line.materialId);
            const qty = num(line.quantity);
            const short = s && qty > s.onHand;
            return (
              <li
                key={line.key}
                className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-start"
              >
                <FormField
                  label="Material"
                  htmlFor={k('material')}
                  required
                  error={errors[k('material')]}
                  hint={s?.material.spec}
                >
                  <select
                    id={k('material')}
                    value={line.materialId}
                    onChange={(e) => updateLine(line.key, { materialId: e.target.value, quantity: '' })}
                    aria-invalid={Boolean(errors[k('material')])}
                    className={inputClass}
                  >
                    <option value="">Choose a material…</option>
                    {grouped.map((group) => (
                      <optgroup key={group.id} label={group.label}>
                        {group.items
                          .filter((i) => i.material.id === line.materialId || !chosen.has(i.material.id))
                          .map((i) => (
                            <option key={i.material.id} value={i.material.id}>
                              {i.material.name}
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
                    s && (
                      <span className={short ? 'text-amber-700' : undefined}>
                        {s.onHand > 0 ? `${formatQuantity(s.onHand, s.material.unit)} in store` : 'None in store'}
                      </span>
                    )
                  }
                >
                  <QuantityInput
                    id={k('quantity')}
                    value={line.quantity}
                    onChange={(value) => updateLine(line.key, { quantity: value })}
                    unit={s ? unitSuffix(s.material.unit) : undefined}
                    step={s ? 1 / 10 ** getUnit(s.material.unit).decimals : 1}
                    disabled={!s}
                    error={errors[k('quantity')]}
                  />
                </FormField>
                {lines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                    aria-label="Remove material"
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
        {lines.length < stock.length && (
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, { key: newId(), materialId: '', quantity: '' }])}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50/40 hover:text-gray-900"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add another material
          </button>
        )}

        <SectionHeading
          title="Delivery"
          aside={planStart ? `Sub-task starts ${formatDayMonth(planStart)}` : undefined}
          className="mt-8"
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Needed by" htmlFor="mr-needed" required error={errors.neededBy}>
            <input
              id="mr-needed"
              type="date"
              min={today}
              value={neededBy}
              onChange={(e) => setNeededBy(e.target.value)}
              aria-invalid={Boolean(errors.neededBy)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Deliver to" htmlFor="mr-deliver" required error={errors.deliverTo} hint="Where on site">
            <input
              id="mr-deliver"
              value={deliverTo}
              onChange={(e) => setDeliverTo(e.target.value)}
              placeholder="e.g. Block A · Level 3"
              aria-invalid={Boolean(errors.deliverTo)}
              className={inputClass}
            />
          </FormField>
        </div>
        {planStart && neededBy > planStart && today < planStart && (
          <p className="mt-3 flex items-start gap-2 text-xs text-amber-800">
            <Icon name="triangleAlert" className="mt-px h-3.5 w-3.5 shrink-0" />
            That’s after the sub-task is planned to start on {formatDayMonth(planStart)}.
          </p>
        )}

        <FormField label="Note" htmlFor="mr-note" className="mt-6" hint="Anything the store should know">
          <textarea
            id="mr-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Send cement in two loads - half now, half on Thursday"
            className={inputClass}
          />
        </FormField>
      </form>
    </SlideOver>
  );
}

export default MaterialRequestForm;
