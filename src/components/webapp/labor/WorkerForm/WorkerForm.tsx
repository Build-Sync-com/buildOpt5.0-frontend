import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import Icon from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../../materials/SectionHeading/SectionHeading';
import { FormField } from '../../materials/FormField/FormField';
// import { QuantityInput } from '../../materials/FormField/FormField'; // commented-out rate fields
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../../materials/formStyles';
import {
  MIN_WORKING_AGE,
  // REQUIRED_PPE, - commented-out Safety section
  employments,
  getGrade,
  getTrade,
  grades,
  ppeItems,
  trades,
} from '../../../../constants/labor';
import { ageOn, normalizePhone, parseNic, suggestedOtRate, workerCode } from '../../../../utils/labor';
import { formatDate, todayISO } from '../../../../utils/materials';
// import { formatCurrency } from '../../../../utils/materials'; // commented-out rate fields
import type { Employment, PpeItemId, SkillGrade, TradeId, Worker, WorkerDraft } from '../../../../types/labor';

/**
 * WorkerForm
 *
 * Registers a worker joining site, or edits one already on the register.
 * Date of birth and gender come from the NIC, so they can't disagree with
 * it; anyone under 18 can't be registered, and a NIC can only be on the
 * register once. Day and overtime rates are suggested from the grade.
 */
type WorkerFormProps = {
  /** Edit this worker; omit to register a new one. */
  worker?: Worker;
  /** Everyone on the register, to stop the same NIC twice. */
  workers: Worker[];
  subcontractors: string[];
  onSubmit: (draft: WorkerDraft) => void;
  onClose: () => void;
};

type Draft = {
  name: string;
  callingName: string;
  nic: string;
  phone: string;
  address: string;
  emergencyName: string;
  emergencyPhone: string;
  trade: TradeId | '';
  grade: SkillGrade;
  employment: Employment;
  subcontractor: string;
  dayRate: string;
  otRate: string;
  joinedOn: string;
  inducted: boolean;
  inductedOn: string;
  ppe: PpeItemId[];
  remarks: string;
};

type Errors = Partial<Record<keyof Draft, string>>;

const num = (value: string) => (value.trim() === '' ? NaN : Number(value));

function fromWorker(worker: Worker | undefined, today: string): Draft {
  if (!worker) {
    return {
      name: '',
      callingName: '',
      nic: '',
      phone: '',
      address: '',
      emergencyName: '',
      emergencyPhone: '',
      trade: '',
      grade: 'skilled',
      employment: 'direct',
      subcontractor: '',
      dayRate: '',
      otRate: '',
      joinedOn: today,
      // The Safety section is commented out, so don't record an induction or PPE nobody confirmed.
      // With it back, default to: inducted: true, ppe: [...REQUIRED_PPE]
      inducted: false,
      inductedOn: today,
      ppe: [],
      remarks: '',
    };
  }
  return {
    name: worker.name,
    callingName: worker.callingName ?? '',
    nic: worker.nic,
    phone: worker.phone,
    address: worker.address,
    emergencyName: worker.emergencyName ?? '',
    emergencyPhone: worker.emergencyPhone ?? '',
    trade: worker.trade,
    grade: worker.grade,
    employment: worker.employment,
    subcontractor: worker.subcontractor ?? '',
    dayRate: String(worker.dayRate),
    otRate: String(worker.otRate),
    joinedOn: worker.joinedOn,
    inducted: Boolean(worker.inductedOn),
    inductedOn: worker.inductedOn ?? today,
    ppe: worker.ppe,
    remarks: worker.remarks ?? '',
  };
}

function WorkerForm({ worker, workers, subcontractors, onSubmit, onClose }: WorkerFormProps) {
  const formId = useId();
  const listId = useId();
  const today = todayISO();
  const editing = Boolean(worker);

  const [draft, setDraft] = useState<Draft>(() => fromWorker(worker, today));
  // Commented-out rate fields: once someone types an OT rate, stop replacing it with the suggestion.
  // const [otTouched, setOtTouched] = useState(editing);
  const [submitted, setSubmitted] = useState(false);

  const nic = parseNic(draft.nic);
  const age = nic ? ageOn(nic.birthDate, today) : undefined;
  // While the rate fields are commented out: an edited worker keeps the rates
  // they had; a new worker gets their grade's usual rate, OT at time and a half.
  const dayRate = draft.dayRate.trim() ? num(draft.dayRate) : getGrade(draft.grade).rate;
  const otRate = draft.otRate.trim() ? num(draft.otRate) : suggestedOtRate(dayRate);
  // Commented-out rate fields:
  // const otSuggestion = dayRate > 0 ? suggestedOtRate(dayRate) : undefined;
  // const gradeRate = getGrade(draft.grade).rate;

  const validate = (): Errors => {
    const e: Errors = {};
    if (!draft.name.trim()) e.name = 'Enter their name as on the NIC.';

    if (!draft.nic.trim()) e.nic = 'Enter the NIC number.';
    else if (!nic) e.nic = 'Not a valid NIC - 9 digits and V or X, or 12 digits.';
    else if (age !== undefined && age < MIN_WORKING_AGE) e.nic = `Under ${MIN_WORKING_AGE} - can’t work on site.`;
    else {
      const twin = workers.find((w) => w.id !== worker?.id && w.nic === nic.nic);
      if (twin) {
        e.nic = `Already registered to ${twin.name} (${workerCode(twin.workerNo)}${twin.release ? ', released' : ''}).`;
      }
    }

    if (!draft.phone.trim()) e.phone = 'Enter a contact number.';
    else if (!normalizePhone(draft.phone)) e.phone = '10 digits, e.g. 077 123 4567.';
    if (!draft.address.trim()) e.address = 'Enter their address.';
    if (draft.emergencyPhone.trim() && !normalizePhone(draft.emergencyPhone)) {
      e.emergencyPhone = '10 digits, e.g. 077 123 4567.';
    }

    if (!draft.trade) e.trade = 'Choose a trade.';
    if (draft.employment === 'subcontract' && !draft.subcontractor.trim()) {
      e.subcontractor = 'Which labour contractor?';
    }
    // Commented-out rate fields:
    // if (!(dayRate > 0)) e.dayRate = 'Enter the day rate.';
    // const ot = num(draft.otRate);
    // if (draft.otRate.trim() && !(ot >= 0)) e.otRate = 'Enter a valid rate.';

    if (!draft.joinedOn) e.joinedOn = 'Enter the date.';
    else if (draft.joinedOn > today) e.joinedOn = 'Can’t be in the future.';
    if (draft.inducted) {
      if (!draft.inductedOn) e.inductedOn = 'Enter the date.';
      else if (draft.inductedOn > today) e.inductedOn = 'Can’t be in the future.';
    }
    return e;
  };

  const errors = submitted ? validate() : {};
  const hasErrors = Object.keys(errors).length > 0;

  const update = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  // Commented-out rate fields:
  // const setDayRate = (value: string) => {
  //   const n = num(value);
  //   update({ dayRate: value, ...(otTouched ? {} : { otRate: n > 0 ? String(suggestedOtRate(n)) : '' }) });
  // };

  const setTrade = (id: TradeId | '') => {
    if (!id) return update({ trade: '' });
    // The first trade picked fills in its usual grade.
    const grade = draft.trade || editing ? draft.grade : getTrade(id).grade;
    update({ trade: id, grade });
    // With the rate fields back, also fill in that grade's rate if none is typed yet:
    // const rate = draft.dayRate.trim() ? undefined : getGrade(grade).rate;
    // update({
    //   trade: id,
    //   grade,
    //   ...(rate && { dayRate: String(rate), ...(otTouched ? {} : { otRate: String(suggestedOtRate(rate)) }) }),
    // });
  };

  // Commented-out Safety section:
  // const togglePpe = (id: PpeItemId) =>
  //   update({ ppe: draft.ppe.includes(id) ? draft.ppe.filter((p) => p !== id) : [...draft.ppe, id] });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate()).length > 0 || !nic || !draft.trade) return;
    onSubmit({
      name: draft.name.trim().replace(/\s+/g, ' '),
      callingName: draft.callingName.trim() || undefined,
      nic: nic.nic,
      birthDate: nic.birthDate,
      gender: nic.gender,
      phone: normalizePhone(draft.phone) ?? draft.phone,
      address: draft.address.trim(),
      emergencyName: draft.emergencyName.trim() || undefined,
      emergencyPhone: draft.emergencyPhone.trim() ? (normalizePhone(draft.emergencyPhone) ?? undefined) : undefined,
      trade: draft.trade,
      grade: draft.grade,
      employment: draft.employment,
      subcontractor: draft.employment === 'subcontract' ? draft.subcontractor.trim() : undefined,
      dayRate,
      otRate,
      joinedOn: draft.joinedOn,
      inductedOn: draft.inducted ? draft.inductedOn : undefined,
      ppe: ppeItems.map((p) => p.id).filter((id) => draft.ppe.includes(id)),
      remarks: draft.remarks.trim() || undefined,
    });
  };

  const chip = (active: boolean) =>
    `rounded-lg border px-3 py-2 text-left transition-colors ${
      active ? 'border-blue-600 bg-white ring-1 ring-blue-600' : 'border-gray-200 bg-white hover:border-gray-300'
    }`;

  return (
    <SlideOver
      open
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      eyebrow={editing ? workerCode(worker?.workerNo ?? 0) : 'Site register'}
      title={editing ? 'Edit worker' : 'Register a worker'}
      description={
        editing
          ? 'Changes apply from now on; muster marks already taken keep their wages.'
          : 'Take these down from the NIC on the first day, before they start work.'
      }
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-400">
            {/* With the rate fields: `${getTrade(draft.trade).label} · ${formatCurrency(dayRate)} a day` */}
            {draft.trade ? getTrade(draft.trade).label : 'Fields marked * are required'}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
              Cancel
            </button>
            <button type="submit" form={formId} className={`${primaryButtonClass} flex-1 sm:flex-none`}>
              <Icon name={editing ? 'check' : 'userPlus'} className="h-4 w-4" />
              {editing ? 'Save changes' : 'Register worker'}
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            Some details are missing or don’t look right - check the highlighted fields.
          </p>
        )}

        {/* Personal */}
        <SectionHeading title="Personal details" aside="As on the NIC" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Full name" htmlFor="w-name" required error={errors.name} className="sm:col-span-2">
            <input
              id="w-name"
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="e.g. K. A. Sunil Perera"
              autoComplete="off"
              aria-invalid={Boolean(errors.name)}
              className={inputClass}
            />
          </FormField>
          <FormField
            label="NIC number"
            htmlFor="w-nic"
            required
            error={errors.nic}
            hint={
              nic ? (
                <span className={age !== undefined && age < MIN_WORKING_AGE ? 'text-red-600' : 'text-gray-500'}>
                  Born {formatDate(nic.birthDate)} · {age} yrs · {nic.gender === 'female' ? 'Female' : 'Male'}
                </span>
              ) : (
                'Date of birth and gender are read from it'
              )
            }
          >
            <input
              id="w-nic"
              value={draft.nic}
              onChange={(e) => update({ nic: e.target.value.toUpperCase() })}
              placeholder="852341234V or 198523401234"
              autoComplete="off"
              maxLength={14}
              aria-invalid={Boolean(errors.nic)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Calling name" htmlFor="w-calling" hint="What the site calls them, e.g. Sunil baas">
            <input
              id="w-calling"
              value={draft.callingName}
              onChange={(e) => update({ callingName: e.target.value })}
              placeholder="Optional"
              autoComplete="off"
              className={inputClass}
            />
          </FormField>
          <FormField label="Mobile" htmlFor="w-phone" required error={errors.phone}>
            <input
              id="w-phone"
              type="tel"
              inputMode="tel"
              value={draft.phone}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder="077 123 4567"
              aria-invalid={Boolean(errors.phone)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Address" htmlFor="w-address" required error={errors.address} className="sm:col-span-2">
            <input
              id="w-address"
              value={draft.address}
              onChange={(e) => update({ address: e.target.value })}
              placeholder="No., road, town"
              aria-invalid={Boolean(errors.address)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Emergency contact" htmlFor="w-em-name" hint="Name and relationship">
            <input
              id="w-em-name"
              value={draft.emergencyName}
              onChange={(e) => update({ emergencyName: e.target.value })}
              placeholder="e.g. K. A. Malani (wife)"
              className={inputClass}
            />
          </FormField>
          <FormField label="Emergency number" htmlFor="w-em-phone" error={errors.emergencyPhone}>
            <input
              id="w-em-phone"
              type="tel"
              inputMode="tel"
              value={draft.emergencyPhone}
              onChange={(e) => update({ emergencyPhone: e.target.value })}
              placeholder="077 123 4567"
              aria-invalid={Boolean(errors.emergencyPhone)}
              className={inputClass}
            />
          </FormField>
        </div>

        {/* Work */}
        {/* Was "Trade & pay" - back to that when the rate fields return. */}
        <SectionHeading title="Trade" className="mt-8" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField
            label="Trade"
            htmlFor="w-trade"
            required
            error={errors.trade}
            hint={draft.trade ? getTrade(draft.trade).hint : undefined}
          >
            <select
              id="w-trade"
              value={draft.trade}
              onChange={(e) => setTrade(e.target.value as TradeId | '')}
              aria-invalid={Boolean(errors.trade)}
              className={inputClass}
            >
              <option value="">Choose a trade…</option>
              {trades.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Joined site" htmlFor="w-joined" required error={errors.joinedOn}>
            <input
              id="w-joined"
              type="date"
              max={today}
              value={draft.joinedOn}
              onChange={(e) => update({ joinedOn: e.target.value })}
              aria-invalid={Boolean(errors.joinedOn)}
              className={inputClass}
            />
          </FormField>
        </div>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-gray-700">
            Grade <span className="text-red-500">*</span>
          </legend>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {grades.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={draft.grade === g.id}
                onClick={() => update({ grade: g.id })}
                className={chip(draft.grade === g.id)}
              >
                <span className="block text-sm font-semibold text-gray-900">{g.label}</span>
                <span className="block text-xs text-gray-500">{g.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-gray-700">
            Employed <span className="text-red-500">*</span>
          </legend>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            {employments.map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={draft.employment === opt.id}
                onClick={() => update({ employment: opt.id })}
                className={chip(draft.employment === opt.id)}
              >
                <span className="block text-sm font-semibold text-gray-900">{opt.label}</span>
                <span className="block text-xs text-gray-500">{opt.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {draft.employment === 'subcontract' && (
          <FormField
            label="Labour contractor"
            htmlFor="w-sub"
            required
            error={errors.subcontractor}
            className="mt-4"
          >
            <input
              id="w-sub"
              list={`${listId}-subs`}
              value={draft.subcontractor}
              onChange={(e) => update({ subcontractor: e.target.value })}
              placeholder="e.g. Amila Labour Contractors"
              aria-invalid={Boolean(errors.subcontractor)}
              className={inputClass}
            />
            <datalist id={`${listId}-subs`}>
              {subcontractors.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </FormField>
        )}

        {/*
          Day rate and overtime rate - commented out for now. Until they come
          back, new workers get their grade's usual rate (see `dayRate` above).
          To restore, remove this comment and the lines marked "commented-out
          rate fields" above.

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField
            label={draft.employment === 'direct' ? 'Day rate' : 'Day rate billed'}
            htmlFor="w-rate"
            required
            error={errors.dayRate}
            hint={
              <span className="flex flex-wrap items-center gap-1.5">
                Usual for {getGrade(draft.grade).label.toLowerCase()}: {formatCurrency(gradeRate)}
                {dayRate !== gradeRate && (
                  <button
                    type="button"
                    onClick={() => setDayRate(String(gradeRate))}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Use
                  </button>
                )}
              </span>
            }
          >
            <QuantityInput id="w-rate" value={draft.dayRate} onChange={setDayRate} unit="Rs. / day" error={errors.dayRate} />
          </FormField>
          <FormField
            label="Overtime rate"
            htmlFor="w-ot"
            error={errors.otRate}
            hint={otSuggestion ? `Time and a half: ${formatCurrency(otSuggestion)} / hr` : 'Worked out from the day rate'}
          >
            <QuantityInput
              id="w-ot"
              value={draft.otRate}
              onChange={(value) => {
                setOtTouched(true);
                update({ otRate: value });
              }}
              unit="Rs. / hr"
              error={errors.otRate}
            />
          </FormField>
        </div>
        */}

        {/*
          Safety (induction and PPE) - commented out for now. New workers are
          saved with no induction date and no PPE. To restore, remove this
          comment and the lines marked "commented-out Safety section" above.

        <SectionHeading title="Safety" aside="Before they start work" className="mt-8" />
        <div className="mt-4 rounded-2xl border border-gray-200 p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={draft.inducted}
              onChange={(e) => update({ inducted: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              <span className="block text-sm font-medium text-gray-900">Site safety induction given</span>
              <span className="block text-xs text-gray-500">Site rules, hazards, emergency exits and assembly point</span>
            </span>
          </label>
          {draft.inducted && (
            <FormField label="Induction date" htmlFor="w-induct" error={errors.inductedOn} className="mt-3 pl-7 sm:w-56">
              <input
                id="w-induct"
                type="date"
                max={today}
                value={draft.inductedOn}
                onChange={(e) => update({ inductedOn: e.target.value })}
                aria-invalid={Boolean(errors.inductedOn)}
                className={inputClass}
              />
            </FormField>
          )}

          <p className="mt-4 text-sm font-medium text-gray-700">PPE issued</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ppeItems.map((item) => {
              const on = draft.ppe.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => togglePpe(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    on
                      ? 'border-blue-600 bg-blue-50 font-medium text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon name={on ? 'check' : 'plus'} className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
          {(!draft.inducted || REQUIRED_PPE.some((id) => !draft.ppe.includes(id))) && (
            <p className="mt-3 flex items-start gap-2 text-xs text-amber-800">
              <Icon name="triangleAlert" className="mt-px h-3.5 w-3.5 shrink-0" />
              You can register them now, but they’ll be flagged until inducted and issued a helmet, boots and vest.
            </p>
          )}
        </div>
        */}

        <FormField label="Remarks" htmlFor="w-remarks" className="mt-6">
          <textarea
            id="w-remarks"
            rows={2}
            value={draft.remarks}
            onChange={(e) => update({ remarks: e.target.value })}
            placeholder="e.g. Licensed for backhoe and excavator"
            className={inputClass}
          />
        </FormField>
      </form>
    </SlideOver>
  );
}

export default WorkerForm;
