import { useCallback, useReducer } from 'react';
import { FIRST_WORKER_NO } from '../constants/labor';
import { createSampleLabor } from '../data/sampleLabor';
import { workFrontKey } from '../utils/labor';
import { newId, nextDocNo } from '../utils/materials';
import type {
  AllocationDraft,
  Assignment,
  AttendanceRecord,
  LaborState,
  Worker,
  WorkerDraft,
  WorkerRelease,
} from '../types/labor';

/**
 * useLaborStore
 *
 * The site register, every job allocation and the muster roll. Allocating
 * a worker takes them off whatever job they were on; releasing a worker
 * takes them off their job and the register.
 *
 * State lives in memory until the labor API exists - swap the reducer's
 * callers for API calls then; the page only uses what this hook returns.
 */
type Action =
  | { type: 'add'; worker: Worker }
  | { type: 'update'; workerId: string; draft: WorkerDraft }
  | { type: 'release'; workerId: string; release: WorkerRelease }
  | { type: 'allocate'; ids: string[]; draft: AllocationDraft }
  | { type: 'endJobs'; assignmentIds: string[]; endedOn: string }
  | { type: 'mark'; records: AttendanceRecord[] }
  | { type: 'unmark'; workerId: string; date: string };

/** Close a job on a date; a job ended the day it started still counts that day. */
function endJob(a: Assignment, endedOn: string): Assignment {
  return { ...a, endedOn: endedOn < a.startedOn ? a.startedOn : endedOn };
}

function reducer(state: LaborState, action: Action): LaborState {
  switch (action.type) {
    case 'add':
      return { ...state, workers: [...state.workers, action.worker] };

    case 'update':
      return {
        ...state,
        workers: state.workers.map((w) => (w.id === action.workerId ? { ...w, ...action.draft } : w)),
      };

    case 'release': {
      const { workerId, release } = action;
      return {
        ...state,
        workers: state.workers.map((w) => (w.id === workerId ? { ...w, release } : w)),
        assignments: state.assignments.map((a) =>
          a.workerId === workerId && !a.endedOn ? endJob(a, release.releasedOn) : a,
        ),
      };
    }

    case 'allocate': {
      const { draft } = action;
      const key = workFrontKey(draft.activity, draft.location);
      const moving = new Set(draft.workerIds);
      // Anyone already on this exact job stays on it rather than restarting.
      const alreadyThere = new Set(
        state.assignments
          .filter((a) => moving.has(a.workerId) && !a.endedOn && workFrontKey(a.activity, a.location) === key)
          .map((a) => a.workerId),
      );
      const assignments = state.assignments.map((a) =>
        moving.has(a.workerId) && !a.endedOn && !alreadyThere.has(a.workerId) ? endJob(a, draft.startedOn) : a,
      );
      const added: Assignment[] = draft.workerIds
        .filter((id) => !alreadyThere.has(id))
        .map((workerId, i) => ({
          id: action.ids[i],
          workerId,
          activity: draft.activity,
          location: draft.location,
          startedOn: draft.startedOn,
          expectedEnd: draft.expectedEnd,
          note: draft.note,
          assignedBy: draft.assignedBy,
        }));
      return { ...state, assignments: [...assignments, ...added] };
    }

    case 'endJobs': {
      const ids = new Set(action.assignmentIds);
      return {
        ...state,
        assignments: state.assignments.map((a) => (ids.has(a.id) && !a.endedOn ? endJob(a, action.endedOn) : a)),
      };
    }

    case 'mark': {
      const replaced = new Set(action.records.map((r) => `${r.workerId}|${r.date}`));
      return {
        ...state,
        attendance: [
          ...state.attendance.filter((r) => !replaced.has(`${r.workerId}|${r.date}`)),
          ...action.records,
        ],
      };
    }

    case 'unmark':
      return {
        ...state,
        attendance: state.attendance.filter((r) => !(r.workerId === action.workerId && r.date === action.date)),
      };
  }
}

export function useLaborStore() {
  const [state, dispatch] = useReducer(reducer, undefined, createSampleLabor);

  /** Put a worker on the register; returns their new register number. */
  const addWorker = useCallback(
    (draft: WorkerDraft): Worker => {
      const worker: Worker = {
        ...draft,
        id: newId(),
        workerNo: nextDocNo(state.workers.map((w) => w.workerNo), FIRST_WORKER_NO),
      };
      dispatch({ type: 'add', worker });
      return worker;
    },
    [state.workers],
  );

  const updateWorker = useCallback((workerId: string, draft: WorkerDraft) => {
    dispatch({ type: 'update', workerId, draft });
  }, []);

  /** Take a worker off site; their job ends on the release date. */
  const releaseWorker = useCallback((workerId: string, release: WorkerRelease) => {
    dispatch({ type: 'release', workerId, release });
  }, []);

  /** Put workers on a job, moving them off whatever they were on. */
  const allocate = useCallback((draft: AllocationDraft) => {
    dispatch({ type: 'allocate', ids: draft.workerIds.map(() => newId()), draft });
  }, []);

  /** Take workers off their jobs - they're free from then on. */
  const endJobs = useCallback((assignmentIds: string[], endedOn: string) => {
    dispatch({ type: 'endJobs', assignmentIds, endedOn });
  }, []);

  /** Record (or correct) muster marks. */
  const markAttendance = useCallback((records: AttendanceRecord[]) => {
    dispatch({ type: 'mark', records });
  }, []);

  /** Clear a mark put in by mistake. */
  const unmarkAttendance = useCallback((workerId: string, date: string) => {
    dispatch({ type: 'unmark', workerId, date });
  }, []);

  return { state, addWorker, updateWorker, releaseWorker, allocate, endJobs, markAttendance, unmarkAttendance };
}
