import { addDays, todayISO } from '../utils/materials';
import type { Program, ProgramLevel, ProgramNode } from '../types/program';

/**
 * Sample construction program until the program API exists.
 *
 * Stands in for what the planning team builds in the admin portal: one
 * main task, sections, tasks and sub-tasks with start dates and working-day
 * durations, plus the working calendar (Sundays and public holidays off).
 * Dates are relative to today and line up with the labour sample, e.g.
 * Block A Level 3 brickwork is under way now.
 */
const ago = (days: number) => addDays(todayISO(), -days);
const inDays = (days: number) => addDays(todayISO(), days);

/** [name, start (days from today, negative = past), duration in working days] */
type SampleSubTask = [string, number, number];
type SampleTask = [string, SampleSubTask[]];
type SampleSection = [string, SampleTask[]];

const MAIN_TASK = 'Kadawatha Residential Complex - Civil & Structural Works';

const sections: SampleSection[] = [
  [
    'Preliminaries',
    [
      [
        'Site establishment',
        [
          ['Site clearing & grubbing', -100, 6],
          ['Hoarding & site office', -95, 8],
          ['Temporary power & water', -90, 5],
        ],
      ],
      ['Setting out', [['Survey & setting out', -86, 3]]],
    ],
  ],
  [
    'Block A',
    [
      [
        'Substructure',
        [
          ['Excavation for footings', -82, 8],
          ['Blinding & footing concrete', -72, 6],
          ['Column stumps & ground beams', -65, 8],
          ['Backfilling & compaction', -56, 4],
        ],
      ],
      [
        'Superstructure',
        [
          ['Ground floor columns & Level 1 slab', -51, 12],
          ['Level 2 columns & slab', -37, 12],
          ['Level 3 columns & roof slab', -23, 12],
        ],
      ],
      [
        'Masonry & finishes',
        [
          ['Brickwork - Level 1', -40, 10],
          ['Brickwork - Level 2', -20, 12],
          ['Brickwork - Level 3', -6, 12],
          ['Plastering - Level 1', -5, 10],
          ['Floor tiling - Ground floor', -8, 6],
          ['Painting', 20, 18],
        ],
      ],
      [
        'Services',
        [
          ['Plumbing first fix - Level 1', -12, 10],
          ['Electrical conduiting', -2, 15],
          ['Plumbing first fix - Levels 2 & 3', 14, 12],
        ],
      ],
    ],
  ],
  [
    'Block B',
    [
      [
        'Substructure',
        [
          ['Excavation for footings', -60, 7],
          ['Footing concrete', -51, 5],
          ['Column stumps & ground beams', -45, 7],
        ],
      ],
      [
        'Superstructure',
        [
          ['Level 1 columns & slab', -22, 14],
          ['Level 2 columns & slab', -4, 14],
          ['Level 3 columns & roof slab', 14, 14],
        ],
      ],
      [
        'Masonry & finishes',
        [
          ['Brickwork - Level 1', 6, 10],
          ['Brickwork - Levels 2 & 3', 30, 18],
          ['Plastering', 45, 20],
        ],
      ],
    ],
  ],
  [
    'External works',
    [
      [
        'Car park',
        [
          ['Retaining wall excavation', -1, 6],
          ['Retaining wall concrete', 7, 10],
          ['Car park paving', 60, 12],
        ],
      ],
      [
        'Drainage',
        [
          ['Storm water drains', 40, 15],
          ['Septic tank & soakage pit', 50, 10],
        ],
      ],
    ],
  ],
];

function buildTasks(): ProgramNode[] {
  let n = 0;
  const nodes: ProgramNode[] = [];
  const add = (parentId: string | null, name: string, level: ProgramLevel, order: number, extra: Partial<ProgramNode> = {}) => {
    const node: ProgramNode = { id: `pg-${++n}`, parentId, name, level, order, ...extra };
    nodes.push(node);
    return node.id;
  };

  const root = add(null, MAIN_TASK, 0, 0);
  sections.forEach(([sectionName, tasks], si) => {
    const section = add(root, sectionName, 1, si);
    tasks.forEach(([taskName, subTasks], ti) => {
      const task = add(section, taskName, 2, ti);
      subTasks.forEach(([name, start, duration], i) =>
        add(task, name, 3, i, { startDate: start < 0 ? ago(-start) : inDays(start), duration }),
      );
    });
  });
  return nodes;
}

/** Sundays from 4 months back to a year ahead, plus fixed public holidays. */
function buildHolidays(): string[] {
  const from = ago(120);
  const to = inDays(365);
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const [y, m, day] = d.split('-').map(Number);
    if (new Date(y, m - 1, day).getDay() === 0) days.push(d);
  }
  const years = new Set([from.slice(0, 4), to.slice(0, 4)]);
  years.forEach((y) => {
    // Tamil Thai Pongal, Independence Day, Sinhala & Tamil New Year, May Day, Christmas.
    ['01-15', '02-04', '04-13', '04-14', '05-01', '12-25'].forEach((md) => days.push(`${y}-${md}`));
  });
  return [...new Set(days)].sort();
}

export function createSampleProgram(): Program {
  return { tasks: buildTasks(), holidays: buildHolidays() };
}
