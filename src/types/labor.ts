/**
 * Labor - domain types.
 *
 * How labour works on site, and what's tracked for it:
 *
 * - Workers are registered when they join site: who they are (NIC, contact,
 *   emergency contact), their trade and grade, whether the company employs
 *   them directly or a labour contractor supplies them, their day rate and
 *   overtime rate, and their safety induction and PPE.
 * - Every morning the muster roll is taken: each worker on the register is
 *   marked present, half day, absent or on leave. Overtime hours are added
 *   at the end of the day. Wages come out of the muster roll.
 * - Engineers allocate workers to work: an activity at a work front, e.g.
 *   "Brickwork" at "Block A · Level 3". A worker stays on that job until
 *   they're moved or the job finishes. A worker who's present with no job
 *   is free to allocate.
 * - Workers leave site when they're released (work finished, transferred,
 *   resigned…). Their record stays for wages and history.
 */

export type TradeId =
  | 'mason'
  | 'carpenter'
  | 'steel-fixer'
  | 'concretor'
  | 'tiler'
  | 'painter'
  | 'plumber'
  | 'electrician'
  | 'welder'
  | 'scaffolder'
  | 'operator'
  | 'driver'
  | 'helper'
  | 'watcher';

/** Foreman leads a gang; skilled is a tradesman ("baas"); unskilled is a helper. */
export type SkillGrade = 'foreman' | 'skilled' | 'semi-skilled' | 'unskilled';

/** On the company's own payroll, or supplied (and paid) by a labour contractor. */
export type Employment = 'direct' | 'subcontract';

export type Gender = 'male' | 'female';

export type PpeItemId = 'helmet' | 'boots' | 'vest' | 'gloves' | 'harness';

export type AttendanceMark = 'present' | 'half-day' | 'absent' | 'leave';

export type ReleaseReason = 'completed' | 'transferred' | 'resigned' | 'dismissed' | 'other';

export type WorkerRelease = {
  releasedOn: string;
  reason: ReleaseReason;
  note?: string;
  releasedBy: string;
};

/** A worker on the site register. */
export type Worker = {
  id: string;
  /** Site register / ID card number, shown as W-1001. */
  workerNo: number;
  /** Name as on the NIC, e.g. "K. A. Sunil Perera". */
  name: string;
  /** What the site calls them, e.g. "Sunil baas". */
  callingName?: string;
  /** National identity card number, old (9 digits + V/X) or new (12 digits). */
  nic: string;
  /** Worked out from the NIC. ISO date. */
  birthDate: string;
  gender: Gender;
  /** Local format, 10 digits: 0771234567. */
  phone: string;
  address: string;
  emergencyName?: string;
  emergencyPhone?: string;

  trade: TradeId;
  grade: SkillGrade;
  employment: Employment;
  /** Labour contractor's name, for subcontract workers. */
  subcontractor?: string;
  /** Rupees for a full day. For subcontract workers, what the contractor bills. */
  dayRate: number;
  /** Rupees per overtime hour. */
  otRate: number;

  /** First day on site. */
  joinedOn: string;
  /** Date of the site safety induction, if given. */
  inductedOn?: string;
  /** PPE handed over. */
  ppe: PpeItemId[];
  remarks?: string;

  /** Set when the worker leaves site. */
  release?: WorkerRelease;
};

/** A worker put on an activity at a work front, until moved or finished. */
export type Assignment = {
  id: string;
  workerId: string;
  /** What they're doing, e.g. "Slab shuttering". */
  activity: string;
  /** Where, e.g. "Block B · Level 2". */
  location: string;
  startedOn: string;
  /** When the engineer expects the job to finish. */
  expectedEnd?: string;
  /** Set once they come off the job. */
  endedOn?: string;
  assignedBy: string;
  note?: string;
};

/** One worker's muster mark for one day. */
export type AttendanceRecord = {
  workerId: string;
  date: string;
  mark: AttendanceMark;
  /** Overtime on top of the normal day. */
  otHours?: number;
  markedBy: string;
};

export type LaborState = {
  workers: Worker[];
  assignments: Assignment[];
  attendance: AttendanceRecord[];
};

/* ---------------------------------------------------------------------------
 * Drafts - what the forms hand over
 * ------------------------------------------------------------------------- */

export type WorkerDraft = Omit<Worker, 'id' | 'workerNo' | 'release'>;

export type AllocationDraft = {
  workerIds: string[];
  activity: string;
  location: string;
  startedOn: string;
  expectedEnd?: string;
  note?: string;
  assignedBy: string;
};

/* ---------------------------------------------------------------------------
 * Summaries - worked out from the state for the page
 * ------------------------------------------------------------------------- */

/**
 * Where a worker stands today:
 * - assigned: on a job (present, or not marked yet)
 * - free: present with no job - ready to allocate
 * - absent / leave: marked off today (they may still hold a job)
 * - unmarked: no job and not on the muster yet
 * - released: left site
 */
export type WorkerStatus = 'assigned' | 'free' | 'absent' | 'leave' | 'unmarked' | 'released';

export type WorkerSummary = {
  worker: Worker;
  status: WorkerStatus;
  /** Today's muster mark, if taken. */
  today?: AttendanceRecord;
  /** The job they're on now. */
  assignment?: Assignment;
  /** Every job they've had, newest first. */
  history: Assignment[];
  /** Muster marks, newest first. */
  attendance: AttendanceRecord[];
  age: number;
  /** This calendar month, up to today. */
  month: {
    daysWorked: number;
    otHours: number;
    wages: number;
  };
};

/** Workers on the same activity at the same place. */
export type WorkFront = {
  key: string;
  activity: string;
  location: string;
  members: WorkerSummary[];
  /** Earliest start among the members. */
  startedOn: string;
  /** Latest expected finish among the members, if any. */
  expectedEnd?: string;
};
