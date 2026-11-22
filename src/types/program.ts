/**
 * Construction program - domain types.
 *
 * The program is built in the admin portal (Planning) and only shown here,
 * read-only. The shape matches the admin portal's: a flat list of nodes,
 * each pointing at its parent, four levels deep:
 *
 *   0 = Main task   (one root, the overall work package)
 *   1 = Section     (e.g. "Block A")
 *   2 = Task        (e.g. "Substructure")
 *   3 = Sub-task    (the scheduled activity, e.g. "Excavation for footings")
 *
 * Only sub-tasks carry a start date and a duration in working days; every
 * parent's dates are rolled up from the sub-tasks beneath it, using the
 * site's working calendar (non-working days don't count).
 *
 * The admin portal also stores a cost on each sub-task (Costing). Costs are
 * never shown on this portal, so they're not part of these types - the API
 * for this portal should leave them out.
 */

export type ProgramLevel = 0 | 1 | 2 | 3;

export type ProgramNode = {
  id: string;
  /** Null for the main task. */
  parentId: string | null;
  name: string;
  level: ProgramLevel;
  /** Position among its siblings. */
  order: number;
  /** Sub-tasks only. ISO date. */
  startDate?: string;
  /** Sub-tasks only. Working days. */
  duration?: number;
};

export type Program = {
  tasks: ProgramNode[];
  /** Non-working days (Sundays, holidays) from the admin working calendar. ISO dates. */
  holidays: string[];
};

/** A node's resolved dates: entered for sub-tasks, rolled up for parents. */
export type Schedule = {
  start: string | null;
  finish: string | null;
  /** Working days. */
  duration: number | null;
  scheduled: boolean;
};
