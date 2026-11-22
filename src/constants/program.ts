import type { ProgramLevel } from '../types/program';

/**
 * Program levels, named the way the admin portal names them, with the
 * styling that tells them apart in the tree.
 */
export const LEAF_LEVEL: ProgramLevel = 3;

export const programLevels: {
  level: ProgramLevel;
  label: string;
  /** What its children are called, e.g. a section holds "tasks". */
  childNoun: string | null;
  row: string;
  accent: string;
  name: string;
  tag: string;
}[] = [
  {
    level: 0,
    label: 'Main task',
    childNoun: 'section',
    row: 'bg-gray-50',
    accent: 'bg-gray-400',
    name: 'text-base font-semibold text-gray-900',
    tag: 'bg-gray-200 text-gray-600',
  },
  {
    level: 1,
    label: 'Section',
    childNoun: 'task',
    row: 'bg-blue-50/40',
    accent: 'bg-blue-600',
    name: 'text-sm font-semibold text-gray-900',
    tag: 'bg-blue-100 text-blue-700',
  },
  {
    level: 2,
    label: 'Task',
    childNoun: 'sub-task',
    row: '',
    accent: 'bg-amber-400',
    name: 'text-sm font-medium text-gray-900',
    tag: 'bg-amber-50 text-amber-800',
  },
  {
    level: 3,
    label: 'Sub-task',
    childNoun: null,
    row: '',
    accent: 'bg-transparent',
    name: 'text-sm text-gray-700',
    tag: 'bg-gray-100 text-gray-500',
  },
];

export function getProgramLevel(level: ProgramLevel) {
  return programLevels[level] ?? programLevels[LEAF_LEVEL];
}
