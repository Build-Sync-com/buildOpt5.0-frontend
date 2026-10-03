import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Icon from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../../materials/SectionHeading/SectionHeading';
import { FormField, QuantityInput } from '../../materials/FormField/FormField';
import { accentButtonClass, inputClass, primaryButtonClass, secondaryButtonClass } from '../../materials/formStyles';
import HireClock from '../HireClock/HireClock';
import { FuelGauge } from '../FuelGauge/FuelGauge';
import { RegPlate } from '../FleetBoard/FleetBoard';
import { DueBadge, MachineStatusBadge } from '../StatusBadge/StatusBadge';
import {
  arrivalChecks,
  getCondition,
  getMachineCategory,
  getMeterKind,
  machineStatuses,
} from '../../../../constants/machinery';
import { formatMeter, formatRate } from '../../../../utils/machinery';
import { formatCurrency, formatDate, formatDayMonth, todayISO } from '../../../../utils/materials';
import type {
  EquipmentReceipt,
  MachineLogDraft,
  MachineStatus,
  MachineSummary,
} from '../../../../types/machinery';

/**
 * MachinePanel
 *
 * One machine in detail: hire so far, the daily log (with a quick form to
 * add today's status and meter), its off-hire date, how it arrived and - once
 * it's gone - how it left.
 */
type MachinePanelProps = {
  summary: MachineSummary | null;
  receipt?: EquipmentReceipt;
  canManage: boolean;
  loggedBy: string;
  onClose: () => void;
  onLog: (draft: MachineLogDraft) => void;
  onExtend: (machineId: string, dueBack: string) => void;
  onSendBack: (machineId: string) => void;
};

const statusDot: Record<MachineStatus, string> = {
  working: 'bg-blue-600',
  idle: 'bg-gray-400',
  breakdown: 'bg-red-500',
};

const num = (value: string) => (value.trim() === '' ? NaN : Number(value));

function LogForm({
  summary,
  loggedBy,
  onLog,
}: {
  summary: MachineSummary;
  loggedBy: string;
  onLog: (draft: MachineLogDraft) => void;
}) {
  const { machine } = summary;
  const meter = getMeterKind(machine.meter);
  const today = todayISO();
  const [status, setStatus] = useState<MachineStatus>(summary.status === 'returned' ? 'working' : summary.status);
  const [date, setDate] = useState(today);
  const [reading, setReading] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Readings can't go backwards: compare against the highest logged on or before the date.
  const floor = Math.max(
    machine.meterIn ?? 0,
    ...summary.logs.filter((l) => l.date <= date && l.meterReading !== undefined).map((l) => l.meterReading as number),
  );

  const validate = () => {
    const found: Record<string, string> = {};
    if (!date) found.date = 'Pick a date.';
    else if (date > today) found.date = 'Can’t log the future.';
    else if (date < machine.arrivedOn) found.date = 'Before it arrived.';
    if (reading.trim()) {
      const value = num(reading);
      if (!(value >= 0)) found.reading = 'Enter a valid reading.';
      else if (value < floor) found.reading = `Lower than ${formatMeter(floor, machine.meter)} already logged.`;
    }
    if (status === 'breakdown' && !note.trim()) found.note = 'Say what’s wrong.';
    return found;
  };
  const errors = submitted ? validate() : {};

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate()).length > 0) return;
    onLog({
      machineId: machine.id,
      date,
      status,
      meterReading: reading.trim() ? num(reading) : undefined,
      note: note.trim() || undefined,
      loggedBy,
    });
    setReading('');
    setNote('');
    setSubmitted(false);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
      <fieldset>
        <legend className="text-sm font-medium text-gray-700">Status</legend>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {machineStatuses.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={status === s.id}
              onClick={() => setStatus(s.id)}
              className={`rounded-lg border px-2 py-2 text-left transition-colors ${
                status === s.id
                  ? s.id === 'breakdown'
                    ? 'border-red-400 bg-red-50'
                    : 'border-blue-600 bg-white ring-1 ring-blue-600'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                <span className={`h-2 w-2 rounded-full ${statusDot[s.id]}`} />
                {s.label}
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">{s.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField label="Date" htmlFor="log-date" error={errors.date}>
          <input
            id="log-date"
            type="date"
            min={machine.arrivedOn}
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={Boolean(errors.date)}
            className={inputClass}
          />
        </FormField>
        {machine.meter !== 'none' && (
          <FormField
            label={`${meter.label} reading`}
            htmlFor="log-reading"
            error={errors.reading}
            hint={summary.latestMeter !== undefined ? `Last ${formatMeter(summary.latestMeter, machine.meter)}` : undefined}
          >
            <QuantityInput
              id="log-reading"
              value={reading}
              onChange={setReading}
              unit={meter.short}
              step={0.1}
              placeholder="Optional"
              error={errors.reading}
            />
          </FormField>
        )}
      </div>
      <FormField
        label="Note"
        htmlFor="log-note"
        error={errors.note}
        className="mt-4"
        required={status === 'breakdown'}
      >
        <input
          id="log-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={status === 'breakdown' ? 'What’s wrong, who’s fixing it' : 'e.g. Trenching at Block B'}
          aria-invalid={Boolean(errors.note)}
          className={inputClass}
        />
      </FormField>
      <div className="mt-4 flex justify-end">
        <button type="submit" className={`${primaryButtonClass} py-2`}>
          <Icon name="plus" className="h-4 w-4" />
          Add to log
        </button>
      </div>
    </form>
  );
}

function OffHireEditor({
  summary,
  canManage,
  onExtend,
}: {
  summary: MachineSummary;
  canManage: boolean;
  onExtend: (machineId: string, dueBack: string) => void;
}) {
  const { machine } = summary;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(machine.dueBack ?? '');
  const invalid = !value || value < machine.arrivedOn;

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-500">Off-hire</span>
        <span className="font-semibold text-gray-900">
          {machine.dueBack ? formatDate(machine.dueBack) : 'No date agreed'}
        </span>
        <DueBadge due={summary.due} daysToDue={summary.daysToDue} />
        {canManage && !summary.returned && (
          <button
            type="button"
            onClick={() => {
              setValue(machine.dueBack ?? '');
              setEditing(true);
            }}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Icon name="pencil" className="h-3.5 w-3.5" />
            {machine.dueBack ? 'Change' : 'Set date'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="due-back" className="text-sm text-gray-500">
        Off-hire
      </label>
      <input
        id="due-back"
        type="date"
        min={machine.arrivedOn}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`${inputClass} w-auto`}
      />
      <button
        type="button"
        disabled={invalid}
        onClick={() => {
          onExtend(machine.id, value);
          setEditing(false);
        }}
        className={`${primaryButtonClass} py-2`}
      >
        Save
      </button>
      <button type="button" onClick={() => setEditing(false)} className={`${secondaryButtonClass} py-2`}>
        Cancel
      </button>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{children}</dd>
    </div>
  );
}

function MachinePanel({
  summary,
  receipt,
  canManage,
  loggedBy,
  onClose,
  onLog,
  onExtend,
  onSendBack,
}: MachinePanelProps) {
  if (!summary) return null;
  const { machine, returned } = summary;
  const category = getMachineCategory(machine.category);
  const meter = getMeterKind(machine.meter);

  return (
    <SlideOver
      open
      onClose={onClose}
      eyebrow={category.label}
      title={machine.type}
      description={
        <span className="flex flex-wrap items-center gap-2">
          {machine.model}
          <RegPlate regNo={machine.regNo} />
        </span>
      }
      footer={
        canManage &&
        !returned && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => onSendBack(machine.id)} className={accentButtonClass}>
              <Icon name="undo" className="h-4 w-4" />
              {machine.ownership === 'hired' ? 'Off-hire & send back' : 'Send back to yard'}
            </button>
          </div>
        )
      }
    >
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-2 rounded-xl border border-gray-200 p-4 sm:col-span-1">
          <p className="text-xs text-gray-500">
            {machine.ownership !== 'hired' ? 'Ownership' : returned ? 'Hire billed' : 'Hire so far'}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {machine.ownership === 'hired' ? formatCurrency(summary.hireCost) : 'Company'}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            {machine.rate ? formatRate(machine.rate) : 'No hire charge'}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">{returned ? 'Was on site' : 'On site'}</p>
          <p className="mt-1 font-semibold text-gray-900">
            {summary.daysOnSite} {summary.daysOnSite === 1 ? 'day' : 'days'}
          </p>
          <div className="mt-2">
            <MachineStatusBadge status={summary.status} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">{machine.meter === 'km' ? 'Driven on site' : 'Used on site'}</p>
          <p className="mt-1 font-semibold text-gray-900">
            {summary.usage !== undefined ? formatMeter(summary.usage, machine.meter) : '-'}
          </p>
          <p className="mt-2 truncate text-xs text-gray-400">
            {summary.latestMeter !== undefined
              ? `${meter.label} at ${formatMeter(summary.latestMeter, machine.meter)}`
              : meter.label}
          </p>
        </div>
      </div>

      {/* Hire period */}
      <SectionHeading title="Hire period" className="mt-8" />
      <div className="mt-4 space-y-4">
        <HireClock arrivedOn={machine.arrivedOn} dueBack={machine.dueBack} returnedOn={returned?.returnedOn} />
        <OffHireEditor key={machine.id} summary={summary} canManage={canManage} onExtend={onExtend} />
      </div>

      {/* Daily log */}
      {canManage && !returned && (
        <>
          <SectionHeading title="Log today" aside="Status and meter" className="mt-8" />
          <LogForm key={machine.id} summary={summary} loggedBy={loggedBy} onLog={onLog} />
        </>
      )}

      {/* Return */}
      {returned && (
        <>
          <SectionHeading title="Sent back" aside={`RTN ${returned.rtnNo}`} className="mt-8" />
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            <Detail label="Date">{formatDate(returned.returnedOn)}</Detail>
            {returned.meterOut !== undefined && (
              <Detail label={`${meter.label} out`}>{formatMeter(returned.meterOut, machine.meter)}</Detail>
            )}
            <Detail label="Fuel out">
              <FuelGauge level={returned.fuelOut} />
            </Detail>
            <Detail label="Condition">{getCondition(returned.conditionOut).label}</Detail>
            {machine.ownership === 'hired' && <Detail label="Hire billed">{formatCurrency(returned.hireCost)}</Detail>}
            {returned.damage && (
              <div className="col-span-2 sm:col-span-3">
                <Detail label="Damage noted">
                  <span className="text-amber-700">{returned.damage}</span>
                </Detail>
              </div>
            )}
          </dl>
        </>
      )}

      {/* Arrival */}
      <SectionHeading title="Arrival" aside={`ERN ${machine.ernNo}`} className="mt-8" />
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        <Detail label="Arrived">{formatDate(machine.arrivedOn)}</Detail>
        <Detail label="Owner">{machine.owner}</Detail>
        <Detail label="Operator">{machine.operator ?? <span className="text-gray-400">None</span>}</Detail>
        {machine.meterIn !== undefined && (
          <Detail label={`${meter.label} in`}>{formatMeter(machine.meterIn, machine.meter)}</Detail>
        )}
        <Detail label="Fuel in">
          <FuelGauge level={machine.fuelIn} />
        </Detail>
        <Detail label="Condition">
          {getCondition(machine.conditionIn).label}
          <span className="text-gray-400"> · {getCondition(machine.conditionIn).hint}</span>
        </Detail>
        {machine.serialNo && <Detail label="Serial no.">{machine.serialNo}</Detail>}
        {receipt && <Detail label="Reference">{receipt.reference}</Detail>}
        {receipt?.hireOrder && <Detail label="Hire order">{receipt.hireOrder}</Detail>}
        {machine.remarks && (
          <div className="col-span-2 sm:col-span-3">
            <Detail label="Remarks">{machine.remarks}</Detail>
          </div>
        )}
      </dl>

      <ul className="mt-4 space-y-1.5 rounded-xl bg-gray-50 p-3.5">
        {arrivalChecks.map((check) => {
          const passed = machine.checks.includes(check.id);
          return (
            <li key={check.id} className="flex items-center gap-2 text-sm">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  passed ? 'bg-blue-600 text-white' : 'border border-amber-400 bg-amber-50 text-amber-700'
                }`}
              >
                <Icon name={passed ? 'check' : 'x'} className="h-3 w-3" strokeWidth={2.5} />
              </span>
              <span className={passed ? 'text-gray-700' : 'font-medium text-amber-800'}>{check.label}</span>
              {!passed && <span className="text-xs text-amber-700">Not confirmed</span>}
            </li>
          );
        })}
      </ul>

      {/* Log */}
      <SectionHeading title="Log" aside={`${summary.logs.length} entries`} className="mt-8" />
      {summary.logs.length ? (
        <ol className="mt-4">
          {summary.logs.map((log) => (
            <li key={log.id} className="group relative flex gap-3 pb-4 last:pb-0">
              <span className="relative flex w-3 flex-col items-center pt-1.5">
                <span className={`relative z-10 h-2.5 w-2.5 rounded-full ring-4 ring-white ${statusDot[log.status]}`} />
                <span
                  className="absolute top-4 bottom-0 border-l border-dashed border-gray-300 group-last:hidden"
                  aria-hidden="true"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900">
                    {machineStatuses.find((s) => s.id === log.status)?.label}
                    {log.meterReading !== undefined && (
                      <span className="font-normal text-gray-500"> · {formatMeter(log.meterReading, machine.meter)}</span>
                    )}
                  </p>
                  <p className="shrink-0 text-xs text-gray-400">{formatDayMonth(log.date)}</p>
                </div>
                {log.note && <p className="text-sm text-gray-600">{log.note}</p>}
                <p className="text-xs text-gray-400">{log.loggedBy}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-gray-500">Nothing logged yet.</p>
      )}
    </SlideOver>
  );
}

export default MachinePanel;
