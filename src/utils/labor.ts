import { OT_MULTIPLIER, STANDARD_HOURS, getAttendanceMark, trades } from '../constants/labor';
import { daysBetween, toISODate, todayISO } from './materials';
import type {
  AttendanceRecord,
  Gender,
  LaborState,
  Worker,
  WorkerStatus,
  WorkerSummary,
  WorkFront,
} from '../types/labor';

/**
 * NIC, phone, wage and allocation helpers for labor. Dates and currency
 * share the helpers in utils/materials.ts.
 */

/* ---------------------------------------------------------------------------
 * NIC
 * ------------------------------------------------------------------------- */

export type NicInfo = {
  /** Cleaned up: no spaces, upper-case letter. */
  nic: string;
  format: 'old' | 'new';
  birthDate: string;
  gender: Gender;
};

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Read a Sri Lankan NIC number.
 *
 * - Old format: 9 digits and V or X - YY DDD SSSS, e.g. 852341234V.
 * - New format: 12 digits - YYYY DDD SSSSS, e.g. 198523401234.
 *
 * DDD is the day of the year of birth, plus 500 for women. NIC day numbers
 * count February as 29 days every year. Returns null if it isn't a valid
 * number.
 */
export function parseNic(input: string): NicInfo | null {
  const nic = input.replace(/\s+/g, '').toUpperCase();
  const old = /^(\d{2})(\d{3})\d{4}[VX]$/.exec(nic);
  const fresh = /^(\d{4})(\d{3})\d{5}$/.exec(nic);
  const match = old ?? fresh;
  if (!match) return null;

  const year = old ? 1900 + Number(match[1]) : Number(match[1]);
  let day = Number(match[2]);
  const gender: Gender = day > 500 ? 'female' : 'male';
  if (day > 500) day -= 500;
  if (day < 1 || day > 366) return null;
  if (year < 1900 || year > new Date().getFullYear()) return null;

  // Day numbers follow a leap-year calendar, so read them against 2000.
  const ref = new Date(2000, 0, day);
  if (ref.getMonth() === 1 && ref.getDate() === 29 && !isLeapYear(year)) return null;

  return {
    nic,
    format: old ? 'old' : 'new',
    birthDate: toISODate(new Date(year, ref.getMonth(), ref.getDate())),
    gender,
  };
}

/** Whole years old on a date. */
export function ageOn(birthDate: string, on = todayISO()): number {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [y, m, d] = on.split('-').map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}

/* ---------------------------------------------------------------------------
 * Phone numbers
 * ------------------------------------------------------------------------- */

/** "077 123 4567", "+94 77 123 4567" → "0771234567". Null if it isn't 10 digits. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, '');
  let local = digits;
  if (/^\+94\d{9}$/.test(digits)) local = `0${digits.slice(3)}`;
  else if (/^94\d{9}$/.test(digits)) local = `0${digits.slice(2)}`;
  return /^0\d{9}$/.test(local) ? local : null;
}

/** "0771234567" → "077 123 4567". */
export function formatPhone(phone: string): string {
  return /^0\d{9}$/.test(phone) ? `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}` : phone;
}

/* ---------------------------------------------------------------------------
 * Names and numbers
 * ------------------------------------------------------------------------- */

/** "W-1001". */
export function workerCode(workerNo: number): string {
  return `W-${workerNo}`;
}

/** Initials from the given name and surname, skipping the initials: "K. A. Sunil Perera" → "SP". */
export function nameInitials(name: string): string {
  const words = name.split(/\s+/).filter((w) => w && !w.endsWith('.'));
  const pick = words.length ? words : name.split(/\s+/).filter(Boolean);
  if (pick.length === 0) return '?';
  const first = pick[0][0];
  const last = pick.length > 1 ? pick[pick.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}

/* ---------------------------------------------------------------------------
 * Wages
 * ------------------------------------------------------------------------- */

/** Overtime rate offered for a day rate: hourly rate × 1.5, to the nearest Rs. 10. */
export function suggestedOtRate(dayRate: number): number {
  return Math.round(((dayRate / STANDARD_HOURS) * OT_MULTIPLIER) / 10) * 10;
}

/** What one muster mark earns. */
export function wageFor(worker: Worker, record: AttendanceRecord): number {
  const worked = getAttendanceMark(record.mark).worked;
  return worked * worker.dayRate + (worked > 0 ? (record.otHours ?? 0) * worker.otRate : 0);
}

/* ---------------------------------------------------------------------------
 * Summaries
 * ------------------------------------------------------------------------- */

/** Whether a worker was on the register on a date. */
export function onRegisterOn(worker: Worker, date: string): boolean {
  return worker.joinedOn <= date && (!worker.release || worker.release.releasedOn >= date);
}

function statusFor(worker: Worker, today: AttendanceRecord | undefined, hasJob: boolean): WorkerStatus {
  if (worker.release) return 'released';
  if (today?.mark === 'absent') return 'absent';
  if (today?.mark === 'leave') return 'leave';
  if (hasJob) return 'assigned';
  return today ? 'free' : 'unmarked';
}

/** Every worker with today's status, job, history and this month's wages. */
export function summarizeWorkers(state: LaborState, today = todayISO()): WorkerSummary[] {
  const monthStart = `${today.slice(0, 8)}01`;
  const attendanceBy = new Map<string, AttendanceRecord[]>();
  state.attendance.forEach((r) => {
    const list = attendanceBy.get(r.workerId) ?? [];
    list.push(r);
    attendanceBy.set(r.workerId, list);
  });

  return state.workers.map((worker) => {
    const history = state.assignments
      .filter((a) => a.workerId === worker.id)
      .sort(
        (a, b) =>
          Number(Boolean(a.endedOn)) - Number(Boolean(b.endedOn)) ||
          b.startedOn.localeCompare(a.startedOn) ||
          (b.endedOn ?? '').localeCompare(a.endedOn ?? ''),
      );
    const assignment = worker.release ? undefined : history.find((a) => !a.endedOn);
    const attendance = (attendanceBy.get(worker.id) ?? []).sort((a, b) => b.date.localeCompare(a.date));
    const todayRecord = attendance.find((r) => r.date === today);

    const thisMonth = attendance.filter((r) => r.date >= monthStart && r.date <= today);
    const daysWorked = thisMonth.reduce((sum, r) => sum + getAttendanceMark(r.mark).worked, 0);
    const otHours = thisMonth.reduce(
      (sum, r) => sum + (getAttendanceMark(r.mark).worked > 0 ? (r.otHours ?? 0) : 0),
      0,
    );

    return {
      worker,
      status: statusFor(worker, todayRecord, Boolean(assignment)),
      today: todayRecord,
      assignment,
      history,
      attendance,
      age: ageOn(worker.birthDate, today),
      month: {
        daysWorked,
        otHours,
        wages: thisMonth.reduce((sum, r) => sum + wageFor(worker, r), 0),
      },
    };
  });
}

const tradeOrder = new Map(trades.map((t, i) => [t.id, i]));

/** By trade in the usual order, foremen first, then by name. */
export function compareWorkers(a: WorkerSummary, b: WorkerSummary): number {
  return (
    (tradeOrder.get(a.worker.trade) ?? 0) - (tradeOrder.get(b.worker.trade) ?? 0) ||
    Number(b.worker.grade === 'foreman') - Number(a.worker.grade === 'foreman') ||
    a.worker.name.localeCompare(b.worker.name)
  );
}

export function workFrontKey(activity: string, location: string): string {
  return `${activity.trim().toLowerCase()}|${location.trim().toLowerCase()}`;
}

/** Workers on site grouped by the job they're on, oldest job first. */
export function groupWorkFronts(summaries: WorkerSummary[]): WorkFront[] {
  const fronts = new Map<string, WorkFront>();
  summaries.forEach((s) => {
    const a = s.assignment;
    if (!a) return;
    const key = workFrontKey(a.activity, a.location);
    const front = fronts.get(key);
    if (!front) {
      fronts.set(key, {
        key,
        activity: a.activity,
        location: a.location,
        members: [s],
        startedOn: a.startedOn,
        expectedEnd: a.expectedEnd,
      });
      return;
    }
    front.members.push(s);
    if (a.startedOn < front.startedOn) front.startedOn = a.startedOn;
    if (a.expectedEnd && (!front.expectedEnd || a.expectedEnd > front.expectedEnd)) front.expectedEnd = a.expectedEnd;
  });
  return [...fronts.values()]
    .map((f) => ({ ...f, members: [...f.members].sort(compareWorkers) }))
    .sort((a, b) => a.startedOn.localeCompare(b.startedOn) || a.activity.localeCompare(b.activity));
}

/** "3 masons · 2 helpers". */
export function tradeMix(summaries: WorkerSummary[]): string {
  const counts = new Map<string, number>();
  summaries.forEach((s) => counts.set(s.worker.trade, (counts.get(s.worker.trade) ?? 0) + 1));
  return trades
    .filter((t) => counts.has(t.id))
    .map((t) => {
      const n = counts.get(t.id) ?? 0;
      return `${n} ${n === 1 ? t.label.toLowerCase() : t.plural}`;
    })
    .join(' · ');
}

/** Day N of a job, counting the start day as day 1. */
export function jobDay(startedOn: string, today = todayISO()): number {
  return Math.max(1, daysBetween(startedOn, today) + 1);
}
