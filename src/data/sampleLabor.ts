import { FIRST_WORKER_NO, REQUIRED_PPE } from '../constants/labor';
import { parseNic, suggestedOtRate } from '../utils/labor';
import { addDays, todayISO } from '../utils/materials';
import type {
  Assignment,
  AttendanceMark,
  AttendanceRecord,
  Employment,
  LaborState,
  SkillGrade,
  TradeId,
  Worker,
  WorkerRelease,
} from '../types/labor';

/**
 * Sample labour on site until the labor API exists.
 *
 * Twenty-five workers, the jobs they've been on, and five weeks of muster
 * roll. Dates are relative to today, so the site always looks current:
 * most of the gang is allocated, a few are free, one is absent from his
 * job, one is on leave, and three haven't been marked yet this morning.
 */
const ENGINEER = 'D. Wickramasinghe';
const ASSISTANT = 'P. Senaratne';

const ago = (days: number) => addDays(todayISO(), -days);
const inDays = (days: number) => addDays(todayISO(), days);

const CONTRACTOR_A = 'Amila Labour Contractors';
const CONTRACTOR_R = 'Ranasinghe Manpower Services';

type SampleWorker = {
  id: string;
  name: string;
  callingName?: string;
  nic: string;
  phone: string;
  address: string;
  trade: TradeId;
  grade: SkillGrade;
  employment: Employment;
  subcontractor?: string;
  dayRate: number;
  joined: number;
  emergency?: [string, string];
  /** False if they haven't had the site induction yet (otherwise given on their first day). */
  inducted?: boolean;
  ppe?: Worker['ppe'];
  remarks?: string;
  release?: Omit<WorkerRelease, 'releasedOn' | 'releasedBy'> & { daysAgo: number };
};

const people: SampleWorker[] = [
  { id: 'w01', name: 'K. A. Sunil Perera', callingName: 'Sunil baas', nic: '780452317V', phone: '0771234567', address: 'No. 12, Temple Road, Kadawatha', trade: 'mason', grade: 'foreman', employment: 'direct', dayRate: 6500, joined: 64, emergency: ['K. A. Malani (wife)', '0332234567'], ppe: [...REQUIRED_PPE, 'gloves'] },
  { id: 'w02', name: 'M. G. Nimal Jayasinghe', callingName: 'Nimal', nic: '850981452V', phone: '0712345678', address: '45/3, Station Road, Ragama', trade: 'mason', grade: 'skilled', employment: 'direct', dayRate: 5200, joined: 60, emergency: ['M. G. Sriyani (wife)', '0712345600'] },
  { id: 'w03', name: 'H. P. Ruwan Kumara', nic: '900215863V', phone: '0763456789', address: '78, Kandy Road, Kiribathgoda', trade: 'mason', grade: 'skilled', employment: 'direct', dayRate: 5000, joined: 41, emergency: ['H. P. Gunadasa (father)', '0763456700'] },
  { id: 'w04', name: 'S. D. Chaminda Silva', nic: '199234501234', phone: '0754567890', address: 'No. 7, Lake Drive, Gampaha', trade: 'mason', grade: 'skilled', employment: 'direct', dayRate: 5000, joined: 30 },
  { id: 'w05', name: 'A. W. Kamal Fernando', callingName: 'Kamal baas', nic: '820763190V', phone: '0778765432', address: '23, Church Street, Ja-Ela', trade: 'carpenter', grade: 'foreman', employment: 'direct', dayRate: 6200, joined: 55, emergency: ['A. W. Dilani (wife)', '0778765400'] },
  { id: 'w06', name: 'R. M. Prasanna Rathnayake', nic: '870129834V', phone: '0718765432', address: 'Walpola, Minuwangoda', trade: 'carpenter', grade: 'skilled', employment: 'direct', dayRate: 5200, joined: 52 },
  { id: 'w07', name: 'P. K. Asanka Dissanayake', nic: '199530804567', phone: '0729876543', address: 'No. 102/A, Main Street, Negombo', trade: 'carpenter', grade: 'semi-skilled', employment: 'direct', dayRate: 4200, joined: 33 },
  { id: 'w08', name: 'W. A. Lalith Wijesinghe', nic: '880456721V', phone: '0705432198', address: '15, Hospital Road, Wattala', trade: 'steel-fixer', grade: 'skilled', employment: 'subcontract', subcontractor: CONTRACTOR_A, dayRate: 5200, joined: 48 },
  { id: 'w09', name: 'T. M. Sampath Bandara', nic: '199412203456', phone: '0767654321', address: 'Pallewela, Mirigama', trade: 'steel-fixer', grade: 'semi-skilled', employment: 'subcontract', subcontractor: CONTRACTOR_A, dayRate: 4300, joined: 48 },
  { id: 'w10', name: 'D. M. Upul Senanayake', nic: '830612345V', phone: '0779988776', address: '56, Galle Road, Moratuwa', trade: 'electrician', grade: 'skilled', employment: 'direct', dayRate: 5800, joined: 38, emergency: ['D. M. Kanthi (sister)', '0112634521'] },
  { id: 'w11', name: 'G. H. Saman Priyantha', nic: '860345678V', phone: '0714455667', address: 'Makola North, Kiribathgoda', trade: 'plumber', grade: 'skilled', employment: 'direct', dayRate: 5500, joined: 20 },
  { id: 'w12', name: 'N. K. Dinesh Karunaratne', nic: '199125607891', phone: '0752233445', address: 'Ihala Imbulgoda, Imbulgoda', trade: 'tiler', grade: 'skilled', employment: 'subcontract', subcontractor: CONTRACTOR_R, dayRate: 5300, joined: 9 },
  { id: 'w13', name: 'L. P. Gamini Weerasinghe', nic: '790834567V', phone: '0723344556', address: 'Biyagama Road, Kelaniya', trade: 'painter', grade: 'skilled', employment: 'subcontract', subcontractor: CONTRACTOR_R, dayRate: 4800, joined: 7, inducted: false, ppe: ['helmet'], remarks: 'Induction booked for Monday’s toolbox talk.' },
  { id: 'w14', name: 'J. A. Tharindu Lakmal', nic: '199828904321', phone: '0786677889', address: '38, Bodhiraja Mawatha, Kadawatha', trade: 'operator', grade: 'skilled', employment: 'direct', dayRate: 6000, joined: 25, remarks: 'Licensed for backhoe and excavator.' },
  { id: 'w15', name: 'K. P. Nuwan Chathuranga', nic: '200115602345', phone: '0741122334', address: 'Mudungoda, Gampaha', trade: 'helper', grade: 'unskilled', employment: 'direct', dayRate: 3300, joined: 58 },
  { id: 'w16', name: 'S. A. Kasun Madushanka', nic: '200323409876', phone: '0768899001', address: 'Weliweriya', trade: 'helper', grade: 'unskilled', employment: 'subcontract', subcontractor: CONTRACTOR_A, dayRate: 3200, joined: 44 },
  { id: 'w17', name: 'W. M. Kumari Wijeratne', nic: '847123456V', phone: '0717788990', address: 'Pahala Karagahamuna, Kadawatha', trade: 'helper', grade: 'unskilled', employment: 'direct', dayRate: 3300, joined: 50, emergency: ['W. M. Sarath (husband)', '0717788900'] },
  { id: 'w18', name: 'R. A. Pradeep Ranaweera', nic: '199907812345', phone: '0759900112', address: 'Ganemulla', trade: 'helper', grade: 'unskilled', employment: 'subcontract', subcontractor: CONTRACTOR_A, dayRate: 3200, joined: 44 },
  { id: 'w19', name: 'H. M. Ajith Herath', nic: '810567234V', phone: '0776655443', address: 'Kirindiwela', trade: 'helper', grade: 'semi-skilled', employment: 'direct', dayRate: 3800, joined: 62 },
  { id: 'w20', name: 'U. G. Sanjeewa Udayakumara', nic: '199608109876', phone: '0705566778', address: 'Dompe', trade: 'helper', grade: 'unskilled', employment: 'subcontract', subcontractor: CONTRACTOR_R, dayRate: 3200, joined: 28 },
  { id: 'w21', name: 'M. D. Chamara Wickramaratne', nic: '200219005432', phone: '0742211009', address: 'Kandana', trade: 'helper', grade: 'unskilled', employment: 'subcontract', subcontractor: CONTRACTOR_R, dayRate: 3200, joined: 28 },
  { id: 'w22', name: 'A. K. Siripala Gunawardena', callingName: 'Siripala aiya', nic: '640923456V', phone: '0112345678', address: 'Malwana Road, Biyagama', trade: 'watcher', grade: 'unskilled', employment: 'direct', dayRate: 3500, joined: 64, remarks: 'Night watch. Keeps the gate register.' },
  { id: 'w23', name: 'E. P. Indika Samarasinghe', nic: '199733309871', phone: '0763322110', address: 'Yakkala', trade: 'helper', grade: 'unskilled', employment: 'direct', dayRate: 3300, joined: 15 },
  { id: 'w24', name: 'B. G. Rohana Pathirana', nic: '800234561V', phone: '0775544332', address: 'Kadawatha', trade: 'carpenter', grade: 'skilled', employment: 'subcontract', subcontractor: CONTRACTOR_R, dayRate: 5200, joined: 60, release: { daysAgo: 10, reason: 'transferred', note: 'Sent to the Kelaniya housing site.' } },
  { id: 'w25', name: 'S. K. Malith Jayawardena', nic: '200034512345', phone: '0749988776', address: 'Ja-Ela', trade: 'helper', grade: 'unskilled', employment: 'direct', dayRate: 3300, joined: 40, release: { daysAgo: 12, reason: 'resigned' } },
];

function toWorker(p: SampleWorker, index: number): Worker {
  const nic = parseNic(p.nic);
  if (!nic) throw new Error(`Sample NIC is invalid: ${p.nic}`);
  return {
    id: p.id,
    workerNo: FIRST_WORKER_NO + index,
    name: p.name,
    callingName: p.callingName,
    nic: nic.nic,
    birthDate: nic.birthDate,
    gender: nic.gender,
    phone: p.phone,
    address: p.address,
    emergencyName: p.emergency?.[0],
    emergencyPhone: p.emergency?.[1],
    trade: p.trade,
    grade: p.grade,
    employment: p.employment,
    subcontractor: p.subcontractor,
    dayRate: p.dayRate,
    otRate: suggestedOtRate(p.dayRate),
    joinedOn: ago(p.joined),
    inductedOn: p.inducted === false ? undefined : ago(p.joined),
    ppe: p.ppe ?? [...REQUIRED_PPE],
    remarks: p.remarks,
    release: p.release && {
      releasedOn: ago(p.release.daysAgo),
      reason: p.release.reason,
      note: p.release.note,
      releasedBy: ENGINEER,
    },
  };
}

/* ---------------------------------------------------------------------------
 * Jobs: [activity, location, started days ago, ended days ago (open if
 * omitted), expected end in days, worker ids]
 * ------------------------------------------------------------------------- */

type SampleJob = [string, string, number, number | null, number | null, string[]];

const jobs: SampleJob[] = [
  // Finished
  ['Temporary power', 'Site yard', 38, 30, null, ['w10']],
  ['Site clearing', 'Car park', 25, 18, null, ['w14']],
  ['Brickwork', 'Block A · Level 2', 20, 7, null, ['w01', 'w02', 'w03', 'w15', 'w17', 'w19']],
  ['Brickwork', 'Block A · Level 2', 30, 7, null, ['w04']],
  ['Material unloading', 'Main store', 40, 12, null, ['w25']],
  ['Material unloading', 'Main store', 28, 3, null, ['w20', 'w21']],
  ['Rebar fixing', 'Block B · Level 1 columns', 16, 4, null, ['w08', 'w09', 'w16']],
  ['Column formwork', 'Block B · Level 1', 14, 10, null, ['w24']],
  ['Column formwork', 'Block B · Level 1', 14, 5, null, ['w05', 'w06', 'w07', 'w18']],
  ['Plumbing first fix', 'Block A · Level 1', 12, 1, null, ['w11']],
  ['Site cleaning', 'Block B · Ground floor', 15, 1, null, ['w23']],
  ['Floor tiling', 'Block A · Ground floor', 8, 2, null, ['w12']],
  ['Painting', 'Site office', 7, 3, null, ['w13']],
  // On now
  ['Site security', 'Main gate', 64, null, null, ['w22']],
  ['Brickwork', 'Block A · Level 3', 6, null, 8, ['w01', 'w02', 'w03', 'w15', 'w17']],
  ['Plastering', 'Block A · Level 1', 5, null, 4, ['w04', 'w19']],
  ['Slab shuttering', 'Block B · Level 2', 4, null, 3, ['w05', 'w06', 'w07', 'w18']],
  ['Rebar fixing', 'Block B · Level 2', 3, null, 3, ['w08', 'w09', 'w16']],
  ['Electrical conduiting', 'Block A · Level 2', 2, null, 6, ['w10', 'w21']],
  ['Excavation for footings', 'Car park retaining wall', 1, null, 5, ['w14', 'w20']],
];

function buildAssignments(): Assignment[] {
  let n = 0;
  return jobs.flatMap(([activity, location, started, ended, expected, ids]) =>
    ids.map((workerId) => ({
      id: `job-${++n}`,
      workerId,
      activity,
      location,
      startedOn: ago(started),
      endedOn: ended === null ? undefined : ago(ended),
      expectedEnd: expected === null ? undefined : inDays(expected),
      assignedBy: ENGINEER,
    })),
  );
}

/* ---------------------------------------------------------------------------
 * Muster roll - five weeks, the same every time (no randomness)
 * ------------------------------------------------------------------------- */

const HISTORY_DAYS = 35;

/** Today's marks that differ from "present". Missing ids aren't marked yet. */
const todayMarks: Record<string, AttendanceMark | null> = {
  w03: 'absent',
  w09: 'leave',
  w13: null,
  w20: null,
  w21: null,
};

function pastMark(index: number, day: number): { mark: AttendanceMark; otHours?: number } {
  const roll = (index * 7919 + day * 104729 + index * day * 31) % 100;
  if (roll < 86) return { mark: 'present', otHours: (index + day) % 6 === 0 ? 2 : undefined };
  if (roll < 90) return { mark: 'half-day' };
  if (roll < 96) return { mark: 'absent' };
  return { mark: 'leave' };
}

function buildAttendance(workers: Worker[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  workers.forEach((worker, index) => {
    for (let day = HISTORY_DAYS; day >= 0; day--) {
      const date = ago(day);
      if (date < worker.joinedOn) continue;
      if (worker.release && date > worker.release.releasedOn) continue;

      if (day === 0) {
        const mark = worker.id in todayMarks ? todayMarks[worker.id] : 'present';
        if (mark) records.push({ workerId: worker.id, date, mark, markedBy: ASSISTANT });
        continue;
      }
      // Everyone turned up on their first day.
      const { mark, otHours } = date === worker.joinedOn ? { mark: 'present' as const, otHours: undefined } : pastMark(index, day);
      records.push({ workerId: worker.id, date, mark, otHours, markedBy: ASSISTANT });
    }
  });
  return records;
}

export function createSampleLabor(): LaborState {
  const workers = people.map(toWorker);
  return {
    workers,
    assignments: buildAssignments(),
    attendance: buildAttendance(workers),
  };
}
