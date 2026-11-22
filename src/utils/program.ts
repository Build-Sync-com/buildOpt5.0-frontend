import { LEAF_LEVEL } from '../constants/program';
import { addDays } from './materials';
import type { ProgramNode, Schedule } from '../types/program';

/**
 * Working-day scheduling and roll-ups for the construction program.
 *
 * Ported from the admin portal (src/data/planning.js) so dates here always
 * match what the planning team sees there:
 *
 * - A sub-task's duration counts working days only. If its start falls on
 *   a non-working day it rolls forward to the next working day, which is
 *   working day 1; the finish is the last working day it occupies.
 * - A parent starts at its earliest sub-task start and finishes at its
 *   latest finish; its duration is the working days in that span.
 */

/** Never scan further than this for working days (guards an all-holiday calendar). */
const MAX_SCAN_DAYS = 365 * 50;

export function getChildren(tasks: ProgramNode[], parentId: string | null): ProgramNode[] {
  return tasks.filter((t) => t.parentId === parentId).sort((a, b) => a.order - b.order);
}

function nextWorkingDay(iso: string, holidays: Set<string>): string | null {
  let cursor = iso;
  for (let i = 0; i < MAX_SCAN_DAYS; i += 1) {
    if (!holidays.has(cursor)) return cursor;
    cursor = addDays(cursor, 1);
  }
  return null;
}

/** Last working day of a task starting on `start` and lasting `duration` working days. */
export function calculateFinishDate(start: string | undefined, duration: number | undefined, holidays: Set<string>) {
  if (!start || !duration || !Number.isInteger(duration) || duration < 1) return null;
  let cursor = nextWorkingDay(start, holidays);
  if (!cursor) return null;
  let counted = 1;
  let guard = 0;
  while (counted < duration) {
    cursor = addDays(cursor, 1);
    if (!holidays.has(cursor)) counted += 1;
    guard += 1;
    if (guard > MAX_SCAN_DAYS) return null;
  }
  return cursor;
}

/** Working days in [start, finish], both included. */
export function countWorkingDays(start: string, finish: string, holidays: Set<string>): number {
  if (finish < start) return 0;
  let count = 0;
  let cursor = start;
  for (let i = 0; i <= MAX_SCAN_DAYS; i += 1) {
    if (!holidays.has(cursor)) count += 1;
    if (cursor === finish) break;
    cursor = addDays(cursor, 1);
  }
  return count;
}

const UNSCHEDULED: Schedule = { start: null, finish: null, duration: null, scheduled: false };

/** Resolved dates for every node: sub-tasks from their input, parents rolled up. */
export function computeSchedules(tasks: ProgramNode[], holidays: Set<string>): Record<string, Schedule> {
  const schedules: Record<string, Schedule> = {};

  const resolve = (task: ProgramNode): Schedule => {
    const known = schedules[task.id];
    if (known) return known;

    let result: Schedule;
    if (task.level === LEAF_LEVEL) {
      const finish = calculateFinishDate(task.startDate, task.duration, holidays);
      result =
        finish && task.startDate
          ? { start: task.startDate, finish, duration: task.duration ?? null, scheduled: true }
          : UNSCHEDULED;
    } else {
      const scheduled = getChildren(tasks, task.id)
        .map(resolve)
        .filter((s) => s.scheduled);
      if (scheduled.length === 0) {
        result = UNSCHEDULED;
      } else {
        const start = scheduled.reduce((min, s) => (s.start! < min ? s.start! : min), scheduled[0].start!);
        const finish = scheduled.reduce((max, s) => (s.finish! > max ? s.finish! : max), scheduled[0].finish!);
        result = { start, finish, duration: countWorkingDays(start, finish, holidays), scheduled: true };
      }
    }

    schedules[task.id] = result;
    return result;
  };

  tasks.forEach(resolve);
  return schedules;
}

/** Whether a scheduled node's window includes `date`. */
export function isOnNow(schedule: Schedule | undefined, date: string): boolean {
  return Boolean(schedule?.scheduled && schedule.start && schedule.finish && schedule.start <= date && date <= schedule.finish);
}

/** Section and task names above a node, outermost first; the main task is left out. */
export function taskPath(byId: Map<string, ProgramNode>, task: ProgramNode): string[] {
  const names: string[] = [];
  for (let cur = task.parentId ? byId.get(task.parentId) : undefined; cur && cur.parentId; ) {
    names.unshift(cur.name);
    cur = byId.get(cur.parentId);
  }
  return names;
}

/** "12 days". */
export function formatWorkingDays(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}
