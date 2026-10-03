import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Icon from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../SectionHeading/SectionHeading';
import { FormField, QuantityInput } from '../FormField/FormField';
import { accentButtonClass, inputClass, secondaryButtonClass } from '../formStyles';
import { getUnit } from '../../../../constants/materials';
import {
  allocateFifo,
  fitsUnit,
  formatDayMonth,
  formatQuantity,
  newId,
  roundQty,
  todayISO,
  getUseByState,
} from '../../../../utils/materials';
import type { IssueDraft, MaterialStock } from '../../../../types/materials';

/**
 * IssueForm
 *
 * Material issue note: stock leaving the store for the work face. The store
 * keeper picks materials and quantities; the form shows which batches the
 * quantity will come from — oldest first — before anything is recorded.
 */
type LineDraft = {
  key: string;
  materialId: string;
  quantity: string;
};

type HeaderDraft = {
  issuedOn: string;
  workArea: string;
  issuedTo: string;
  purpose: string;
  requestRef: string;
};

type Errors = Record<string, string>;

type IssueFormProps = {
  stock: MaterialStock[];
  workAreas: string[];
  people: string[];
  issuedBy: string;
  initialMaterialId?: string;
  onSubmit: (draft: IssueDraft) => void;
  onClose: () => void;
};

const num = (value: string) => (value.trim() === '' ? NaN : Number(value));

/** Batches that had arrived by the issue date, oldest first. */
function availableBatches(item: MaterialStock | undefined, issuedOn: string) {
  return item ? item.openBatches.filter((b) => b.receivedOn <= issuedOn) : [];
}

function validate(header: HeaderDraft, lines: LineDraft[], stockById: Map<string, MaterialStock>): Errors {
  const errors: Errors = {};
  if (!header.issuedOn) errors.issuedOn = 'Enter the issue date.';
  else if (header.issuedOn > todayISO()) errors.issuedOn = 'An issue can’t be in the future.';
  if (!header.workArea.trim()) errors.workArea = 'Where will it be used?';
  if (!header.issuedTo.trim()) errors.issuedTo = 'Who is collecting it?';

  lines.forEach((line) => {
    const k = (field: string) => `${line.key}-${field}`;
    const item = stockById.get(line.materialId);
    if (!item) {
      errors[k('material')] = 'Choose a material.';
      return;
    }
    const qty = num(line.quantity);
    const unit = getUnit(item.material.unit);
    const available = roundQty(
      availableBatches(item, header.issuedOn).reduce((sum, b) => sum + b.quantityRemaining, 0),
    );
    if (!(qty > 0)) errors[k('quantity')] = 'Enter a quantity.';
    else if (!fitsUnit(qty, unit.id))
      errors[k('quantity')] = unit.decimals ? `Up to ${unit.decimals} decimals.` : 'Whole numbers only.';
    else if (qty > available)
      errors[k('quantity')] = `Only ${formatQuantity(available, unit.id)} in store.`;
  });

  return errors;
}

function IssueForm({
  stock,
  workAreas,
  people,
  issuedBy,
  initialMaterialId,
  onSubmit,
  onClose,
}: IssueFormProps) {
  const formId = useId();
  const listId = useId();
  const today = todayISO();

  const stockById = useMemo(() => new Map(stock.map((s) => [s.material.id, s])), [stock]);
  const inStore = useMemo(
    () =>
      stock
        .filter((s) => s.onHand > 0)
        .sort((a, b) => a.material.name.localeCompare(b.material.name)),
    [stock],
  );

  const [header, setHeader] = useState<HeaderDraft>({
    issuedOn: today,
    workArea: '',
    issuedTo: '',
    purpose: '',
    requestRef: '',
  });
  const [lines, setLines] = useState<LineDraft[]>(() => [
    {
      key: newId(),
      materialId: initialMaterialId && stockById.get(initialMaterialId)?.onHand ? initialMaterialId : '',
      quantity: '',
    },
  ]);
  const [submitted, setSubmitted] = useState(false);

  const errors = submitted ? validate(header, lines, stockById) : {};
  const hasErrors = Object.keys(errors).length > 0;

  const updateHeader = (patch: Partial<HeaderDraft>) => setHeader((prev) => ({ ...prev, ...patch }));
  const updateLine = (key: string, patch: Partial<LineDraft>) =>
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(header, lines, stockById)).length > 0) return;

    onSubmit({
      issuedOn: header.issuedOn,
      workArea: header.workArea.trim(),
      issuedTo: header.issuedTo.trim(),
      purpose: header.purpose.trim() || undefined,
      requestRef: header.requestRef.trim() || undefined,
      issuedBy,
      lines: lines.map((line) => ({ materialId: line.materialId, quantity: num(line.quantity) })),
    });
  };

  const canAddLine = lines.length < inStore.length;

  return (
    <SlideOver
      open
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      eyebrow="Material issue note"
      title="Issue materials"
      description="Hand stock over to the work face. Quantities come out of the oldest batches first."
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-semibold text-gray-900">
              {lines.length} {lines.length === 1 ? 'item' : 'items'}
            </p>
            <p className="text-xs text-gray-400">Issued by {issuedBy}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
              Cancel
            </button>
            <button type="submit" form={formId} className={`${accentButtonClass} flex-1 sm:flex-none`}>
              <Icon name="arrowUpFromLine" className="h-4 w-4" />
              Issue materials
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            Some details are missing or more than the store holds — check the highlighted fields.
          </p>
        )}

        {/* Issue details */}
        <SectionHeading title="Issue details" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Work area" htmlFor="workArea" required error={errors.workArea} hint="Block, level and element">
            <input
              id="workArea"
              list={`${listId}-areas`}
              value={header.workArea}
              onChange={(e) => updateHeader({ workArea: e.target.value })}
              placeholder="e.g. Block A · Level 3 slab"
              aria-invalid={Boolean(errors.workArea)}
              className={inputClass}
            />
            <datalist id={`${listId}-areas`}>
              {workAreas.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Collected by" htmlFor="issuedTo" required error={errors.issuedTo} hint="Foreman or engineer taking the stock">
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
          <FormField label="Purpose / task" htmlFor="purpose">
            <input
              id="purpose"
              value={header.purpose}
              onChange={(e) => updateHeader({ purpose: e.target.value })}
              placeholder="e.g. Slab concreting"
              className={inputClass}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" htmlFor="issuedOn" required error={errors.issuedOn}>
              <input
                id="issuedOn"
                type="date"
                max={today}
                value={header.issuedOn}
                onChange={(e) => updateHeader({ issuedOn: e.target.value })}
                aria-invalid={Boolean(errors.issuedOn)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Request no." htmlFor="requestRef">
              <input
                id="requestRef"
                value={header.requestRef}
                onChange={(e) => updateHeader({ requestRef: e.target.value })}
                placeholder="Optional"
                className={inputClass}
              />
            </FormField>
          </div>
        </div>

        {/* Items */}
        <SectionHeading title="Items to issue" aside="Oldest batch goes out first" className="mt-8" />
        <ol className="mt-4 space-y-4">
          {lines.map((line, index) => {
            const id = (field: string) => `${line.key}-${field}`;
            const item = stockById.get(line.materialId);
            const unitId = item?.material.unit;
            const unit = unitId ? getUnit(unitId) : undefined;
            const batches = availableBatches(item, header.issuedOn);
            const available = roundQty(batches.reduce((sum, b) => sum + b.quantityRemaining, 0));
            const qty = num(line.quantity);
            const allocation = item && qty > 0 ? allocateFifo(batches, qty) : null;
            const leaves = roundQty(available - (qty > 0 ? Math.min(qty, available) : 0));
            const takenElsewhere = new Set(lines.filter((l) => l.key !== line.key).map((l) => l.materialId));

            return (
              <li key={line.key} className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">Item {index + 1}</p>
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

                <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
                  <FormField label="Material" htmlFor={id('material')} required error={errors[id('material')]}>
                    <select
                      id={id('material')}
                      value={line.materialId}
                      onChange={(e) => updateLine(line.key, { materialId: e.target.value, quantity: '' })}
                      aria-invalid={Boolean(errors[id('material')])}
                      className={inputClass}
                    >
                      <option value="">Choose from the store…</option>
                      {inStore
                        .filter((s) => !takenElsewhere.has(s.material.id))
                        .map((s) => (
                          <option key={s.material.id} value={s.material.id}>
                            {s.material.name} ({s.material.spec}) — {formatQuantity(s.onHand, s.material.unit)} in store
                          </option>
                        ))}
                    </select>
                  </FormField>
                  <FormField
                    label="Quantity"
                    htmlFor={id('quantity')}
                    required
                    error={errors[id('quantity')]}
                    hint={item ? `${formatQuantity(available, item.material.unit)} available` : undefined}
                  >
                    <QuantityInput
                      id={id('quantity')}
                      value={line.quantity}
                      onChange={(value) => updateLine(line.key, { quantity: value })}
                      unit={unit?.plural}
                      step={unit ? 1 / 10 ** unit.decimals : 1}
                      disabled={!item}
                      error={errors[id('quantity')]}
                    />
                  </FormField>
                </div>

                {/* FIFO preview */}
                {item && unitId && (
                  <div className="mt-4 rounded-xl bg-gray-50 p-3.5">
                    <p className="text-xs font-semibold text-gray-500">
                      {allocation ? 'Will be taken from' : 'Batches in store, oldest first'}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {(allocation
                        ? allocation.draws.map((d) => ({ batch: d.batch, take: d.quantity, after: d.remainingAfter }))
                        : batches.map((b) => ({ batch: b, take: 0, after: b.quantityRemaining }))
                      ).map(({ batch, take, after }, i) => {
                        const useBy = getUseByState(batch);
                        return (
                          <li key={batch.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            <span
                              className={`h-2 w-2 shrink-0 rounded-full ${i === 0 ? 'bg-amber-400' : 'bg-blue-600'}`}
                              aria-hidden="true"
                            />
                            <span className="min-w-0 flex-1 text-gray-700">
                              Received {formatDayMonth(batch.receivedOn)}
                              <span className="text-gray-400"> · GRN {batch.grnNo} · {batch.location}</span>
                              {useBy === 'expired' && (
                                <span className="ml-2 text-xs font-medium text-red-600">Past use-by — check before use</span>
                              )}
                              {useBy === 'soon' && (
                                <span className="ml-2 text-xs font-medium text-orange-600">Use by soon</span>
                              )}
                            </span>
                            {take > 0 ? (
                              <span className="text-right text-gray-500">
                                <span className="font-semibold text-gray-900">{formatQuantity(take, unitId)}</span>
                                <span className="text-gray-400"> · leaves {formatQuantity(after, unitId)}</span>
                              </span>
                            ) : (
                              <span className="text-gray-500">{formatQuantity(after, unitId)}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {allocation && allocation.shortfall > 0 && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                        <Icon name="triangleAlert" className="h-3.5 w-3.5" />
                        {formatQuantity(allocation.shortfall, unitId)} short — the store doesn’t hold enough.
                      </p>
                    )}
                    {allocation && allocation.shortfall === 0 && (
                      <p
                        className={`mt-2 border-t border-dashed border-gray-200 pt-2 text-xs ${
                          leaves <= item.material.reorderLevel ? 'font-medium text-amber-700' : 'text-gray-500'
                        }`}
                      >
                        Leaves {formatQuantity(leaves, unitId)} in store
                        {leaves <= item.material.reorderLevel &&
                          ` — at or below the reorder level of ${formatQuantity(item.material.reorderLevel, unitId)}`}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {canAddLine && (
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, { key: newId(), materialId: '', quantity: '' }])}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-amber-400 hover:bg-amber-50/40 hover:text-gray-900"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add another material
          </button>
        )}
      </form>
    </SlideOver>
  );
}

export default IssueForm;
