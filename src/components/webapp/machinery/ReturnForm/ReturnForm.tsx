import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Icon from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../../materials/SectionHeading/SectionHeading';
import { FormField, QuantityInput } from '../../materials/FormField/FormField';
import { accentButtonClass, inputClass, secondaryButtonClass } from '../../materials/formStyles';
import { FuelPicker } from '../FuelGauge/FuelGauge';
import { RegPlate } from '../FleetBoard/FleetBoard';
import { conditions, getMachineCategory, getMeterKind } from '../../../../constants/machinery';
import { daysOnSite, formatMeter, formatRate, machineHireCost } from '../../../../utils/machinery';
import { formatCurrency, formatDayMonth, todayISO } from '../../../../utils/materials';
import type {
  Condition,
  EquipmentReturnDraft,
  FuelLevel,
  MachineSummary,
  ToolStock,
} from '../../../../types/machinery';

/**
 * ReturnForm
 *
 * Return note for equipment leaving site. Pick who it's going back to and
 * the form lists everything of theirs still here: tick the machines going
 * (with meter, fuel and condition as they leave - the hire bill is worked
 * out live) and enter how many of each tool lot are going.
 */
type MachineLine = {
  selected: boolean;
  meterOut: string;
  fuelOut: FuelLevel;
  conditionOut: Condition;
  damage: string;
};

type LotLine = { quantity: string; damaged: string };

type HeaderDraft = {
  owner: string;
  returnedOn: string;
  reference: string;
  vehicleNo: string;
  remarks: string;
};

type Errors = Record<string, string>;

type ReturnFormProps = {
  machines: MachineSummary[];
  tools: ToolStock[];
  owners: string[];
  returnedBy: string;
  initialMachineId?: string;
  initialToolId?: string;
  onSubmit: (draft: EquipmentReturnDraft) => void;
  onClose: () => void;
};

const num = (value: string) => (value.trim() === '' ? NaN : Number(value));
const qty = (value: string) => (value.trim() === '' ? 0 : Number(value));

function blankMachineLine(selected = false): MachineLine {
  return { selected, meterOut: '', fuelOut: 2, conditionOut: 'good', damage: '' };
}

function ReturnForm({
  machines,
  tools,
  owners,
  returnedBy,
  initialMachineId,
  initialToolId,
  onSubmit,
  onClose,
}: ReturnFormProps) {
  const formId = useId();
  const today = todayISO();

  const initialOwner =
    machines.find((m) => m.machine.id === initialMachineId)?.machine.owner ??
    tools.find((t) => t.tool.id === initialToolId)?.lots[0]?.owner ??
    (owners.length === 1 ? owners[0] : '');

  const [header, setHeader] = useState<HeaderDraft>({
    owner: initialOwner,
    returnedOn: today,
    reference: '',
    vehicleNo: '',
    remarks: '',
  });
  const [machineLines, setMachineLines] = useState<Record<string, MachineLine>>(() =>
    initialMachineId ? { [initialMachineId]: blankMachineLine(true) } : {},
  );
  const [lotLines, setLotLines] = useState<Record<string, LotLine>>({});
  const [submitted, setSubmitted] = useState(false);

  const ownerMachines = useMemo(
    () => machines.filter((m) => !m.returned && m.machine.owner === header.owner),
    [machines, header.owner],
  );
  const ownerLots = useMemo(
    () =>
      tools.flatMap((stock) =>
        stock.lots.filter((lot) => lot.owner === header.owner).map((lot) => ({ lot, stock })),
      ),
    [tools, header.owner],
  );

  const lineFor = (machineId: string) => machineLines[machineId] ?? blankMachineLine();
  const lotFor = (lotId: string) => lotLines[lotId] ?? { quantity: '', damaged: '' };

  const selectedMachines = ownerMachines.filter((m) => lineFor(m.machine.id).selected);
  const lotsGoing = ownerLots.filter(({ lot }) => qty(lotFor(lot.id).quantity) > 0);
  const piecesGoing = lotsGoing.reduce((sum, { lot }) => sum + qty(lotFor(lot.id).quantity), 0);

  /** Hire for a selected machine if it leaves on the chosen date with the entered meter. */
  const hireFor = (summary: MachineSummary) => {
    const line = lineFor(summary.machine.id);
    const out = num(line.meterOut);
    const meter = Number.isFinite(out) ? Math.max(out, summary.latestMeter ?? 0) : summary.latestMeter;
    return machineHireCost(summary.machine, header.returnedOn || today, meter);
  };
  const totalHire = selectedMachines.reduce((sum, m) => sum + hireFor(m), 0);

  const validate = (): Errors => {
    const errors: Errors = {};
    if (!header.owner) errors.owner = 'Who is it going back to?';
    if (!header.returnedOn) errors.returnedOn = 'Enter the date it left.';
    else if (header.returnedOn > today) errors.returnedOn = 'Can’t be in the future.';
    if (selectedMachines.length === 0 && lotsGoing.length === 0) errors.items = 'Tick a machine or enter tools to send back.';

    selectedMachines.forEach((summary) => {
      const { machine } = summary;
      const line = lineFor(machine.id);
      const k = (field: string) => `${machine.id}-${field}`;
      if (header.returnedOn && header.returnedOn < machine.arrivedOn) errors[k('date')] = 'Arrived after that date.';
      if (machine.meter !== 'none') {
        const out = num(line.meterOut);
        if (!(out >= 0)) errors[k('meterOut')] = 'Read the meter.';
        else if (out < (summary.latestMeter ?? 0))
          errors[k('meterOut')] = `Below ${formatMeter(summary.latestMeter ?? 0, machine.meter)} already logged.`;
      }
      if (line.conditionOut === 'poor' && !line.damage.trim()) errors[k('damage')] = 'Describe the damage.';
    });

    // Tool quantities are checked per lot and per tool (lots share the tool's store count).
    const perTool = new Map<string, { quantity: number; damaged: number }>();
    ownerLots.forEach(({ lot, stock }) => {
      const line = lotFor(lot.id);
      const k = (field: string) => `${lot.id}-${field}`;
      const q = qty(line.quantity);
      const d = qty(line.damaged);
      if (!line.quantity.trim() && !line.damaged.trim()) return;
      if (!(q >= 0) || !Number.isInteger(q)) errors[k('quantity')] = 'Whole pieces only.';
      else if (q > lot.remaining) errors[k('quantity')] = `Only ${lot.remaining} left in this lot.`;
      else if (header.returnedOn && q > 0 && header.returnedOn < lot.receivedOn) errors[k('quantity')] = 'Arrived after that date.';
      if (!(d >= 0) || !Number.isInteger(d)) errors[k('damaged')] = 'Whole pieces only.';
      else if (d > q) errors[k('damaged')] = 'More than going back.';
      const sum = perTool.get(stock.tool.id) ?? { quantity: 0, damaged: 0 };
      perTool.set(stock.tool.id, { quantity: sum.quantity + (q || 0), damaged: sum.damaged + (d || 0) });
    });
    perTool.forEach((sum, toolId) => {
      const stock = tools.find((t) => t.tool.id === toolId);
      if (!stock) return;
      const lot = ownerLots.find((o) => o.stock.tool.id === toolId && qty(lotFor(o.lot.id).quantity) > 0)?.lot;
      if (!lot) return;
      const k = (field: string) => `${lot.id}-${field}`;
      if (sum.damaged > stock.damaged && !errors[k('damaged')])
        errors[k('damaged')] = stock.damaged ? `Only ${stock.damaged} logged as damaged.` : 'None logged as damaged.';
      else if (sum.quantity - sum.damaged > stock.available && !errors[k('quantity')])
        errors[k('quantity')] = `Only ${stock.available} in the store - check in what’s out first.`;
    });

    return errors;
  };

  const errors = submitted ? validate() : {};
  const hasErrors = Object.keys(errors).length > 0;

  const updateHeader = (patch: Partial<HeaderDraft>) => setHeader((prev) => ({ ...prev, ...patch }));
  const updateMachine = (machineId: string, patch: Partial<MachineLine>) =>
    setMachineLines((prev) => ({ ...prev, [machineId]: { ...(prev[machineId] ?? blankMachineLine()), ...patch } }));
  const updateLot = (lotId: string, patch: Partial<LotLine>) =>
    setLotLines((prev) => ({ ...prev, [lotId]: { ...(prev[lotId] ?? { quantity: '', damaged: '' }), ...patch } }));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate()).length > 0) return;

    onSubmit({
      owner: header.owner,
      returnedOn: header.returnedOn,
      reference: header.reference.trim() || undefined,
      vehicleNo: header.vehicleNo.trim() || undefined,
      remarks: header.remarks.trim() || undefined,
      returnedBy,
      machines: selectedMachines.map(({ machine }) => {
        const line = lineFor(machine.id);
        return {
          machineId: machine.id,
          meterOut: machine.meter !== 'none' ? num(line.meterOut) : undefined,
          fuelOut: line.fuelOut,
          conditionOut: line.conditionOut,
          damage: line.damage.trim() || undefined,
        };
      }),
      tools: lotsGoing.map(({ lot }) => ({
        lotId: lot.id,
        toolId: lot.toolId,
        quantity: qty(lotFor(lot.id).quantity),
        damaged: qty(lotFor(lot.id).damaged),
      })),
    });
  };

  const summaryParts = [
    selectedMachines.length &&
      `${selectedMachines.length} ${selectedMachines.length === 1 ? 'machine' : 'machines'}`,
    piecesGoing && `${piecesGoing} ${piecesGoing === 1 ? 'tool' : 'tools'}`,
  ].filter(Boolean);

  return (
    <SlideOver
      open
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      eyebrow="Return note"
      title="Send back equipment"
      description="Off-hire machines and send tools back to their owner. Hire stops on the date they leave."
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-semibold text-gray-900">
              {summaryParts.length ? summaryParts.join(' · ') : 'Nothing selected'}
              {totalHire > 0 && (
                <span className="font-normal text-gray-500"> · {formatCurrency(totalHire)} hire</span>
              )}
            </p>
            <p className="text-xs text-gray-400">Sent by {returnedBy}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
              Cancel
            </button>
            <button type="submit" form={formId} className={`${accentButtonClass} flex-1 sm:flex-none`}>
              <Icon name="undo" className="h-4 w-4" />
              Record return
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errors.items ?? 'Some details are missing or don’t add up - check the highlighted fields.'}
          </p>
        )}

        {/* Return details */}
        <SectionHeading title="Return details" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Sending back to" htmlFor="owner" required error={errors.owner}>
            <select
              id="owner"
              value={header.owner}
              onChange={(e) => {
                updateHeader({ owner: e.target.value });
                setMachineLines({});
                setLotLines({});
              }}
              aria-invalid={Boolean(errors.owner)}
              className={inputClass}
            >
              <option value="">Choose an owner…</option>
              {owners.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Date leaving" htmlFor="returnedOn" required error={errors.returnedOn}>
            <input
              id="returnedOn"
              type="date"
              max={today}
              value={header.returnedOn}
              onChange={(e) => updateHeader({ returnedOn: e.target.value })}
              aria-invalid={Boolean(errors.returnedOn)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Gate pass / return note no." htmlFor="reference">
            <input
              id="reference"
              value={header.reference}
              onChange={(e) => updateHeader({ reference: e.target.value })}
              placeholder="Optional"
              className={inputClass}
            />
          </FormField>
          <FormField label="Vehicle no." htmlFor="vehicleNo">
            <input
              id="vehicleNo"
              value={header.vehicleNo}
              onChange={(e) => updateHeader({ vehicleNo: e.target.value })}
              placeholder="Optional"
              className={inputClass}
            />
          </FormField>
          <FormField label="Remarks" htmlFor="remarks" className="sm:col-span-2">
            <input
              id="remarks"
              value={header.remarks}
              onChange={(e) => updateHeader({ remarks: e.target.value })}
              placeholder="e.g. Earthworks finished at Block B"
              className={inputClass}
            />
          </FormField>
        </div>

        {!header.owner ? (
          <p className="mt-8 rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
            Choose an owner to see their machines and tools on site.
          </p>
        ) : (
          <>
            {/* Machines */}
            <SectionHeading
              title="Machines"
              aside={ownerMachines.length ? `${ownerMachines.length} on site` : undefined}
              className="mt-8"
            />
            {ownerMachines.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">No machines from {header.owner} on site.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {ownerMachines.map((summary) => {
                  const { machine } = summary;
                  const line = lineFor(machine.id);
                  const k = (field: string) => `${machine.id}-${field}`;
                  const meter = getMeterKind(machine.meter);
                  const days = daysOnSite(machine.arrivedOn, header.returnedOn || today);
                  return (
                    <li
                      key={machine.id}
                      className={`rounded-2xl border transition-colors ${
                        line.selected ? 'border-amber-400 bg-amber-50/30' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <label className="flex cursor-pointer items-start gap-3 p-4">
                        <input
                          type="checkbox"
                          checked={line.selected}
                          onChange={(e) => updateMachine(machine.id, { selected: e.target.checked })}
                          className="mt-1 h-4 w-4 rounded border-gray-300 accent-amber-500"
                        />
                        <Icon
                          name={getMachineCategory(machine.category).icon}
                          className="mt-0.5 h-5 w-5 shrink-0 text-gray-400"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-900">{machine.type}</span>
                            <RegPlate regNo={machine.regNo} />
                          </span>
                          <span className="mt-0.5 block text-sm text-gray-500">
                            {machine.model} · arrived {formatDayMonth(machine.arrivedOn)} · {days}{' '}
                            {days === 1 ? 'day' : 'days'}
                          </span>
                          {errors[k('date')] && (
                            <span className="mt-1 block text-xs text-red-600">{errors[k('date')]}</span>
                          )}
                        </span>
                        {machine.rate && (
                          <span className="shrink-0 text-right">
                            <span className="block text-sm font-semibold text-gray-900">
                              {formatCurrency(hireFor(summary))}
                            </span>
                            <span className="block text-xs text-gray-400">{formatRate(machine.rate)}</span>
                          </span>
                        )}
                      </label>

                      {line.selected && (
                        <div className="border-t border-dashed border-amber-200 px-4 pt-4 pb-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            {machine.meter !== 'none' && (
                              <FormField
                                label={`${meter.label} out`}
                                htmlFor={k('meterOut')}
                                required
                                error={errors[k('meterOut')]}
                                hint={
                                  summary.latestMeter !== undefined
                                    ? `Last logged ${formatMeter(summary.latestMeter, machine.meter)}`
                                    : undefined
                                }
                              >
                                <QuantityInput
                                  id={k('meterOut')}
                                  value={line.meterOut}
                                  onChange={(value) => updateMachine(machine.id, { meterOut: value })}
                                  unit={meter.short}
                                  step={0.1}
                                  error={errors[k('meterOut')]}
                                />
                              </FormField>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-700">Fuel out</p>
                              <div className="mt-1.5">
                                <FuelPicker
                                  name={k('fuel')}
                                  value={line.fuelOut}
                                  onChange={(fuelOut) => updateMachine(machine.id, { fuelOut })}
                                />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Condition</p>
                              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                                {conditions.map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    aria-pressed={line.conditionOut === c.id}
                                    onClick={() => updateMachine(machine.id, { conditionOut: c.id })}
                                    className={`rounded-lg border px-2 py-1.5 text-sm font-semibold transition-colors ${
                                      line.conditionOut === c.id
                                        ? c.id === 'poor'
                                          ? 'border-red-400 bg-red-50 text-gray-900'
                                          : 'border-blue-600 bg-blue-50/50 text-gray-900'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    }`}
                                  >
                                    {c.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <FormField
                              label="Damage or missing parts"
                              htmlFor={k('damage')}
                              required={line.conditionOut === 'poor'}
                              error={errors[k('damage')]}
                            >
                              <input
                                id={k('damage')}
                                value={line.damage}
                                onChange={(e) => updateMachine(machine.id, { damage: e.target.value })}
                                placeholder="Anything to note against the owner"
                                aria-invalid={Boolean(errors[k('damage')])}
                                className={inputClass}
                              />
                            </FormField>
                          </div>
                          {machine.ownership === 'hired' && machine.rate?.basis === 'hour' && (
                            <p className="mt-3 text-xs text-gray-500">
                              Hour-rate hire is billed on the meter: {formatRate(machine.rate)} × hours since{' '}
                              {formatMeter(machine.meterIn ?? 0, machine.meter)}.
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Tools */}
            <SectionHeading
              title="Tools"
              aside={ownerLots.length ? 'Enter how many are going' : undefined}
              className="mt-8"
            />
            {ownerLots.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">No tools from {header.owner} on site.</p>
            ) : (
              <ul className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
                {ownerLots.map(({ lot, stock }) => {
                  const line = lotFor(lot.id);
                  const k = (field: string) => `${lot.id}-${field}`;
                  return (
                    <li
                      key={lot.id}
                      className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_8rem_8rem] sm:items-start"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{stock.tool.name}</p>
                        <p className="truncate text-xs text-gray-500">
                          {lot.remaining} of {lot.quantity} left · ERN {lot.ernNo} · {formatDayMonth(lot.receivedOn)}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {stock.available} in store
                          {stock.out > 0 && ` · ${stock.out} out with workers`}
                          {stock.damaged > 0 && ` · ${stock.damaged} damaged`}
                        </p>
                      </div>
                      <FormField label="Going back" htmlFor={k('quantity')} error={errors[k('quantity')]}>
                        <QuantityInput
                          id={k('quantity')}
                          value={line.quantity}
                          onChange={(value) => updateLot(lot.id, { quantity: value })}
                          unit="pcs"
                          error={errors[k('quantity')]}
                        />
                      </FormField>
                      <FormField label="Of which damaged" htmlFor={k('damaged')} error={errors[k('damaged')]}>
                        <QuantityInput
                          id={k('damaged')}
                          value={line.damaged}
                          onChange={(value) => updateLot(lot.id, { damaged: value })}
                          unit="pcs"
                          disabled={stock.damaged === 0}
                          error={errors[k('damaged')]}
                        />
                      </FormField>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </form>
    </SlideOver>
  );
}

export default ReturnForm;
