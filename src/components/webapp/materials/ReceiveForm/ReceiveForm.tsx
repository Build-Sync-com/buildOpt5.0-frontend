import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Icon from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../SectionHeading/SectionHeading';
import { FormField, QuantityInput } from '../FormField/FormField';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../formStyles';
import {
  getUnit,
  materialCategories,
  materialUnits,
  measureKinds,
  storeLocations,
} from '../../../../constants/materials';
import {
  addDays,
  fitsUnit,
  formatCurrency,
  formatQuantity,
  newId,
  roundQty,
  todayISO,
} from '../../../../utils/materials';
import type {
  Material,
  MaterialCategoryId,
  MeasureKind,
  ReceiptDraft,
  UnitId,
} from '../../../../types/materials';

/**
 * ReceiveForm
 *
 * Goods received note for a delivery that has just arrived on site. One
 * delivery can bring several materials; each accepted line becomes a new
 * batch. Rejected quantity (torn bags, wrong grade) is recorded but never
 * reaches stock. A material that isn't on the list yet can be added inline,
 * choosing how it's measured.
 */
const NEW_MATERIAL = '__new';

type NewMaterialDraft = {
  name: string;
  spec: string;
  category: MaterialCategoryId | '';
  measure: MeasureKind;
  unit: UnitId;
  reorderLevel: string;
};

type LineDraft = {
  key: string;
  materialId: string;
  newMaterial: NewMaterialDraft;
  delivered: string;
  rejected: string;
  unitCost: string;
  location: string;
  useBy: string;
  remarks: string;
};

type HeaderDraft = {
  receivedOn: string;
  supplier: string;
  deliveryNote: string;
  vehicleNo: string;
  purchaseOrder: string;
};

type Errors = Record<string, string>;

type ReceiveFormProps = {
  materials: Material[];
  suppliers: string[];
  /** Last unit price paid per material, shown as a hint. */
  lastPrices: Map<string, number>;
  receivedBy: string;
  initialMaterialId?: string;
  onAddMaterial: (draft: Omit<Material, 'id'>) => Material;
  onSubmit: (draft: ReceiptDraft) => void;
  onClose: () => void;
};

const emptyNewMaterial: NewMaterialDraft = {
  name: '',
  spec: '',
  category: '',
  measure: 'count',
  unit: 'nos',
  reorderLevel: '',
};

function blankLine(): LineDraft {
  return {
    key: newId(),
    materialId: '',
    newMaterial: emptyNewMaterial,
    delivered: '',
    rejected: '',
    unitCost: '',
    location: '',
    useBy: '',
    remarks: '',
  };
}

/** Material defaults (location, suggested use-by) for a freshly picked material. */
function applyMaterial(line: LineDraft, material: Material | undefined, receivedOn: string): LineDraft {
  return {
    ...line,
    materialId: material?.id ?? line.materialId,
    location: material?.defaultLocation ?? line.location,
    useBy: material?.shelfLifeDays ? addDays(receivedOn, material.shelfLifeDays) : '',
  };
}

const num = (value: string) => (value.trim() === '' ? NaN : Number(value));

function lineUnit(line: LineDraft, materials: Material[]): UnitId | undefined {
  if (line.materialId === NEW_MATERIAL) return line.newMaterial.unit;
  return materials.find((m) => m.id === line.materialId)?.unit;
}

function acceptedQty(line: LineDraft): number {
  const delivered = num(line.delivered);
  const rejected = num(line.rejected) || 0;
  return Number.isFinite(delivered) ? roundQty(delivered - rejected) : 0;
}

function validate(header: HeaderDraft, lines: LineDraft[], materials: Material[]): Errors {
  const errors: Errors = {};
  const today = todayISO();

  if (!header.receivedOn) errors.receivedOn = 'Enter the delivery date.';
  else if (header.receivedOn > today) errors.receivedOn = 'A delivery can’t be in the future.';
  if (!header.supplier.trim()) errors.supplier = 'Enter the supplier.';
  if (!header.deliveryNote.trim()) errors.deliveryNote = 'Enter the delivery note or invoice number.';

  lines.forEach((line) => {
    const k = (field: string) => `${line.key}-${field}`;
    const unit = lineUnit(line, materials);

    if (!line.materialId) errors[k('material')] = 'Choose a material.';
    if (line.materialId === NEW_MATERIAL) {
      if (!line.newMaterial.name.trim()) errors[k('newName')] = 'Name the material.';
      if (!line.newMaterial.category) errors[k('newCategory')] = 'Pick a category.';
      const reorder = num(line.newMaterial.reorderLevel);
      if (line.newMaterial.reorderLevel && (!(reorder >= 0) || !fitsUnit(reorder, line.newMaterial.unit)))
        errors[k('newReorder')] = 'Enter a valid reorder level.';
    }

    const delivered = num(line.delivered);
    const rejected = line.rejected.trim() ? num(line.rejected) : 0;
    if (!(delivered > 0)) errors[k('delivered')] = 'Enter the quantity delivered.';
    else if (unit && !fitsUnit(delivered, unit))
      errors[k('delivered')] = getUnit(unit).decimals ? `Up to ${getUnit(unit).decimals} decimals.` : 'Whole numbers only.';

    if (!(rejected >= 0)) errors[k('rejected')] = 'Enter 0 or more.';
    else if (unit && !fitsUnit(rejected, unit)) errors[k('rejected')] = 'Check the decimals.';
    else if (delivered > 0 && rejected > delivered) errors[k('rejected')] = 'More than was delivered.';
    else if (delivered > 0 && rejected === delivered)
      errors[k('rejected')] = 'All rejected - remove this item instead.';

    if (line.unitCost.trim() && !(num(line.unitCost) >= 0)) errors[k('unitCost')] = 'Enter a valid price.';
    if (!line.location.trim()) errors[k('location')] = 'Where is it stored?';
    if (line.useBy && header.receivedOn && line.useBy < header.receivedOn)
      errors[k('useBy')] = 'Before the delivery date.';
  });

  return errors;
}

function ReceiveForm({
  materials,
  suppliers,
  lastPrices,
  receivedBy,
  initialMaterialId,
  onAddMaterial,
  onSubmit,
  onClose,
}: ReceiveFormProps) {
  const formId = useId();
  const listId = useId();
  const today = todayISO();

  const [header, setHeader] = useState<HeaderDraft>({
    receivedOn: today,
    supplier: '',
    deliveryNote: '',
    vehicleNo: '',
    purchaseOrder: '',
  });
  const [lines, setLines] = useState<LineDraft[]>(() => {
    const first = blankLine();
    const material = materials.find((m) => m.id === initialMaterialId);
    return [material ? applyMaterial(first, material, today) : first];
  });
  const [submitted, setSubmitted] = useState(false);

  const errors = submitted ? validate(header, lines, materials) : {};
  const hasErrors = Object.keys(errors).length > 0;

  const groupedMaterials = useMemo(
    () =>
      materialCategories
        .map((category) => ({
          ...category,
          items: materials
            .filter((m) => m.category === category.id)
            .sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .filter((group) => group.items.length > 0),
    [materials],
  );

  const total = lines.reduce((sum, line) => {
    const cost = num(line.unitCost);
    return sum + (Number.isFinite(cost) ? cost * acceptedQty(line) : 0);
  }, 0);

  const updateHeader = (patch: Partial<HeaderDraft>) => setHeader((prev) => ({ ...prev, ...patch }));
  const updateLine = (key: string, patch: Partial<LineDraft>) =>
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  const updateNewMaterial = (key: string, patch: Partial<NewMaterialDraft>) =>
    setLines((prev) =>
      prev.map((line) =>
        line.key === key ? { ...line, newMaterial: { ...line.newMaterial, ...patch } } : line,
      ),
    );

  const pickMaterial = (key: string, materialId: string) =>
    setLines((prev) =>
      prev.map((line) => {
        if (line.key !== key) return line;
        if (materialId === NEW_MATERIAL || !materialId)
          return { ...line, materialId, newMaterial: emptyNewMaterial, useBy: '' };
        return applyMaterial(line, materials.find((m) => m.id === materialId), header.receivedOn);
      }),
    );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(header, lines, materials)).length > 0) return;

    const draft: ReceiptDraft = {
      receivedOn: header.receivedOn,
      supplier: header.supplier.trim(),
      deliveryNote: header.deliveryNote.trim(),
      vehicleNo: header.vehicleNo.trim() || undefined,
      purchaseOrder: header.purchaseOrder.trim() || undefined,
      receivedBy,
      lines: lines.map((line) => {
        let materialId = line.materialId;
        if (materialId === NEW_MATERIAL) {
          const nm = line.newMaterial;
          materialId = onAddMaterial({
            name: nm.name.trim(),
            spec: nm.spec.trim(),
            category: nm.category as MaterialCategoryId,
            unit: nm.unit,
            reorderLevel: num(nm.reorderLevel) || 0,
            defaultLocation: line.location.trim(),
          }).id;
        }
        return {
          materialId,
          quantityDelivered: num(line.delivered),
          quantityRejected: num(line.rejected) || 0,
          unitCost: num(line.unitCost) || 0,
          location: line.location.trim(),
          useBy: line.useBy || undefined,
          remarks: line.remarks.trim() || undefined,
        };
      }),
    };
    onSubmit(draft);
  };

  return (
    <SlideOver
      open
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      eyebrow="Goods received note"
      title="Receive delivery"
      description="Record what arrived on site. Each accepted item is stored as a new batch."
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-semibold text-gray-900">
              {lines.length} {lines.length === 1 ? 'item' : 'items'}
              {total > 0 && <span className="font-normal text-gray-500"> · {formatCurrency(Math.round(total))}</span>}
            </p>
            <p className="text-xs text-gray-400">Received by {receivedBy}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
              Cancel
            </button>
            <button type="submit" form={formId} className={`${primaryButtonClass} flex-1 sm:flex-none`}>
              <Icon name="arrowDownToLine" className="h-4 w-4" />
              Record delivery
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            Some details are missing or don’t add up - check the highlighted fields.
          </p>
        )}

        {/* Delivery */}
        <SectionHeading title="Delivery" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Date received" htmlFor="receivedOn" required error={errors.receivedOn}>
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
          <FormField label="Supplier" htmlFor="supplier" required error={errors.supplier}>
            <input
              id="supplier"
              list={`${listId}-suppliers`}
              value={header.supplier}
              onChange={(e) => updateHeader({ supplier: e.target.value })}
              placeholder="Who delivered it"
              aria-invalid={Boolean(errors.supplier)}
              className={inputClass}
            />
            <datalist id={`${listId}-suppliers`}>
              {suppliers.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </FormField>
          <FormField
            label="Delivery note / invoice no."
            htmlFor="deliveryNote"
            required
            error={errors.deliveryNote}
          >
            <input
              id="deliveryNote"
              value={header.deliveryNote}
              onChange={(e) => updateHeader({ deliveryNote: e.target.value })}
              placeholder="As printed on the supplier’s note"
              aria-invalid={Boolean(errors.deliveryNote)}
              className={inputClass}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Vehicle no." htmlFor="vehicleNo">
              <input
                id="vehicleNo"
                value={header.vehicleNo}
                onChange={(e) => updateHeader({ vehicleNo: e.target.value })}
                placeholder="Optional"
                className={inputClass}
              />
            </FormField>
            <FormField label="PO no." htmlFor="purchaseOrder">
              <input
                id="purchaseOrder"
                value={header.purchaseOrder}
                onChange={(e) => updateHeader({ purchaseOrder: e.target.value })}
                placeholder="Optional"
                className={inputClass}
              />
            </FormField>
          </div>
        </div>

        {/* Items */}
        <SectionHeading title="Items received" aside="Each becomes a batch" className="mt-8" />
        <datalist id={`${listId}-locations`}>
          {storeLocations.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>

        <ol className="mt-4 space-y-4">
          {lines.map((line, index) => {
            const id = (field: string) => `${line.key}-${field}`;
            const unitId = lineUnit(line, materials);
            const unit = unitId ? getUnit(unitId) : undefined;
            const step = unit ? 1 / 10 ** unit.decimals : 1;
            const accepted = acceptedQty(line);
            const lastPrice = lastPrices.get(line.materialId);
            const isNew = line.materialId === NEW_MATERIAL;
            const cost = num(line.unitCost);

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

                <FormField label="Material" htmlFor={id('material')} required error={errors[id('material')]} className="mt-3">
                  <select
                    id={id('material')}
                    value={line.materialId}
                    onChange={(e) => pickMaterial(line.key, e.target.value)}
                    aria-invalid={Boolean(errors[id('material')])}
                    className={inputClass}
                  >
                    <option value="">Choose a material…</option>
                    <option value={NEW_MATERIAL}>+ New material (not on the list yet)</option>
                    {groupedMaterials.map((group) => (
                      <optgroup key={group.id} label={group.label}>
                        {group.items.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} - {m.spec}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </FormField>

                {isNew && (
                  <div className="mt-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-4">
                    <p className="text-sm font-semibold text-blue-700">New material</p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <FormField label="Name" htmlFor={id('newName')} required error={errors[id('newName')]}>
                        <input
                          id={id('newName')}
                          value={line.newMaterial.name}
                          onChange={(e) => updateNewMaterial(line.key, { name: e.target.value })}
                          placeholder="e.g. Steel pins"
                          aria-invalid={Boolean(errors[id('newName')])}
                          className={inputClass}
                        />
                      </FormField>
                      <FormField label="Size / grade / pack" htmlFor={id('newSpec')}>
                        <input
                          id={id('newSpec')}
                          value={line.newMaterial.spec}
                          onChange={(e) => updateNewMaterial(line.key, { spec: e.target.value })}
                          placeholder="e.g. 75 mm, galvanised"
                          className={inputClass}
                        />
                      </FormField>
                      <FormField label="Category" htmlFor={id('newCategory')} required error={errors[id('newCategory')]}>
                        <select
                          id={id('newCategory')}
                          value={line.newMaterial.category}
                          onChange={(e) =>
                            updateNewMaterial(line.key, { category: e.target.value as MaterialCategoryId })
                          }
                          aria-invalid={Boolean(errors[id('newCategory')])}
                          className={inputClass}
                        >
                          <option value="">Choose…</option>
                          {materialCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </FormField>
                      <FormField
                        label="Reorder level"
                        htmlFor={id('newReorder')}
                        error={errors[id('newReorder')]}
                        hint="Flag for reorder at this stock"
                      >
                        <QuantityInput
                          id={id('newReorder')}
                          value={line.newMaterial.reorderLevel}
                          onChange={(value) => updateNewMaterial(line.key, { reorderLevel: value })}
                          unit={getUnit(line.newMaterial.unit).plural}
                          step={step}
                          error={errors[id('newReorder')]}
                        />
                      </FormField>
                    </div>

                    <fieldset className="mt-4">
                      <legend className="text-sm font-medium text-gray-700">
                        Measured by <span className="text-red-500">*</span>
                      </legend>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {measureKinds.map((kind) => (
                          <button
                            key={kind.id}
                            type="button"
                            aria-pressed={line.newMaterial.measure === kind.id}
                            onClick={() =>
                              updateNewMaterial(line.key, {
                                measure: kind.id,
                                unit: materialUnits.find((u) => u.measure === kind.id)?.id ?? 'nos',
                              })
                            }
                            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                              line.newMaterial.measure === kind.id
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {kind.label}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {materialUnits
                          .filter((u) => u.measure === line.newMaterial.measure)
                          .map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              aria-pressed={line.newMaterial.unit === u.id}
                              onClick={() => updateNewMaterial(line.key, { unit: u.id })}
                              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                                line.newMaterial.unit === u.id
                                  ? 'border-amber-400 bg-amber-50 font-semibold text-gray-900'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              {u.plural}
                              {u.hint && <span className="ml-1 text-xs text-gray-400">({u.hint})</span>}
                            </button>
                          ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        Stock of this material will always be counted in {getUnit(line.newMaterial.unit).plural}.
                      </p>
                    </fieldset>
                  </div>
                )}

                {/* Quantities */}
                <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <FormField label="Delivered" htmlFor={id('delivered')} required error={errors[id('delivered')]}>
                    <QuantityInput
                      id={id('delivered')}
                      value={line.delivered}
                      onChange={(value) => updateLine(line.key, { delivered: value })}
                      unit={unit?.plural}
                      step={step}
                      error={errors[id('delivered')]}
                    />
                  </FormField>
                  <FormField
                    label="Rejected"
                    htmlFor={id('rejected')}
                    error={errors[id('rejected')]}
                    hint="Damaged or wrong spec"
                  >
                    <QuantityInput
                      id={id('rejected')}
                      value={line.rejected}
                      onChange={(value) => updateLine(line.key, { rejected: value })}
                      unit={unit?.plural}
                      step={step}
                      error={errors[id('rejected')]}
                    />
                  </FormField>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Into stock</p>
                    <p className="mt-1.5 flex h-[38px] items-center rounded-lg bg-blue-50 px-3 text-sm font-semibold text-blue-700">
                      {unitId && accepted > 0 ? formatQuantity(accepted, unitId) : '-'}
                    </p>
                  </div>
                  <FormField
                    label="Unit price (Rs.)"
                    htmlFor={id('unitCost')}
                    error={errors[id('unitCost')]}
                    hint={lastPrice ? `Last paid ${formatCurrency(lastPrice)}` : undefined}
                  >
                    <QuantityInput
                      id={id('unitCost')}
                      value={line.unitCost}
                      onChange={(value) => updateLine(line.key, { unitCost: value })}
                      unit={unit ? `/ ${unit.label}` : undefined}
                      step={0.01}
                      placeholder="Optional"
                      error={errors[id('unitCost')]}
                    />
                  </FormField>
                </div>

                {/* Storage */}
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <FormField label="Store location" htmlFor={id('location')} required error={errors[id('location')]}>
                    <input
                      id={id('location')}
                      list={`${listId}-locations`}
                      value={line.location}
                      onChange={(e) => updateLine(line.key, { location: e.target.value })}
                      placeholder="e.g. Cement shed"
                      aria-invalid={Boolean(errors[id('location')])}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField
                    label="Use by"
                    htmlFor={id('useBy')}
                    error={errors[id('useBy')]}
                    hint="For cement, chemicals, paint"
                  >
                    <input
                      id={id('useBy')}
                      type="date"
                      min={header.receivedOn}
                      value={line.useBy}
                      onChange={(e) => updateLine(line.key, { useBy: e.target.value })}
                      aria-invalid={Boolean(errors[id('useBy')])}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Remarks" htmlFor={id('remarks')}>
                    <input
                      id={id('remarks')}
                      value={line.remarks}
                      onChange={(e) => updateLine(line.key, { remarks: e.target.value })}
                      placeholder="e.g. Mill cert received"
                      className={inputClass}
                    />
                  </FormField>
                </div>

                {Number.isFinite(cost) && accepted > 0 && (
                  <p className="mt-3 text-right text-xs text-gray-500">
                    Item value <span className="font-semibold text-gray-900">{formatCurrency(Math.round(cost * accepted))}</span>
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, blankLine()])}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700"
        >
          <Icon name="plus" className="h-4 w-4" />
          Add another material from this delivery
        </button>
      </form>
    </SlideOver>
  );
}

export default ReceiveForm;
