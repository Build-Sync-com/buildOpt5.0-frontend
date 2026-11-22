import { useMemo, useState } from 'react';
import Icon from '../../../common/Icon/Icon';
import { inputClass, secondaryButtonClass } from '../../materials/formStyles';
import { LEAF_LEVEL, getProgramLevel } from '../../../../constants/program';
import { formatWorkingDays, getChildren, isOnNow } from '../../../../utils/program';
import { formatDate, todayISO } from '../../../../utils/materials';
import type { ProgramNode, Schedule } from '../../../../types/program';

/**
 * ProgramTree
 *
 * The program as the admin portal lays it out - main task, sections, tasks
 * and sub-tasks in an indented, collapsible tree with start, duration and
 * finish - but read-only. Search finds any item by name; "Under way now"
 * narrows the tree to the sub-tasks whose dates include today. Clicking a
 * sub-task opens it, to request labour, materials or machinery for it.
 */
type ProgramTreeProps = {
  root: ProgramNode;
  tasks: ProgramNode[];
  schedules: Record<string, Schedule>;
  /** Requests raised per sub-task id. */
  requestCounts: Map<string, number>;
  onOpen: (taskId: string) => void;
};

type Row = { node: ProgramNode; depth: number; childCount: number };

function plural(n: number, noun: string) {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

function ProgramTree({ root, tasks, schedules, requestCounts, onOpen }: ProgramTreeProps) {
  const today = todayISO();
  const [query, setQuery] = useState('');
  const [onlyNow, setOnlyNow] = useState(false);
  // Opens on the sections and their tasks; sub-tasks show when a task is opened.
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(tasks.filter((t) => t.level < 2).map((t) => t.id)),
  );

  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const parentIds = useMemo(() => tasks.filter((t) => tasks.some((c) => c.parentId === t.id)).map((t) => t.id), [tasks]);

  const q = query.trim().toLowerCase();
  const filtering = Boolean(q) || onlyNow;

  // While filtering: the matching items plus every parent above them, all open.
  const visible = useMemo(() => {
    if (!filtering) return null;
    const keep = new Set<string>();
    tasks.forEach((t) => {
      const nameMatch = !q || t.name.toLowerCase().includes(q);
      const nowMatch = !onlyNow || (t.level === LEAF_LEVEL && isOnNow(schedules[t.id], today));
      if (!nameMatch || !nowMatch) return;
      for (let cur: ProgramNode | undefined = t; cur; cur = cur.parentId ? byId.get(cur.parentId) : undefined) {
        keep.add(cur.id);
      }
    });
    return keep;
  }, [filtering, tasks, q, onlyNow, schedules, today, byId]);

  const rows = useMemo(() => {
    const list: Row[] = [];
    const walk = (node: ProgramNode, depth: number) => {
      if (visible && !visible.has(node.id)) return;
      const children = getChildren(tasks, node.id);
      list.push({ node, depth, childCount: children.length });
      const open = visible ? true : expanded.has(node.id);
      if (open) children.forEach((c) => walk(c, depth + 1));
    };
    walk(root, 0);
    return list;
  }, [root, tasks, expanded, visible]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the program"
              aria-label="Search the program"
              className={`${inputClass} pl-9`}
            />
          </div>
          <button
            type="button"
            onClick={() => setOnlyNow((v) => !v)}
            aria-pressed={onlyNow}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              onlyNow
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${onlyNow ? 'bg-white' : 'bg-blue-600'}`} />
            Under way now
          </button>
        </div>
        {!filtering && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setExpanded(new Set(parentIds))}
              className={`${secondaryButtonClass} px-3 py-1.5`}
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={() => setExpanded(new Set([root.id]))}
              className={`${secondaryButtonClass} px-3 py-1.5`}
            >
              Collapse all
            </button>
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="hidden items-center border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 sm:flex">
          <div className="flex-1 py-2.5 pl-4">Task</div>
          <div className="w-32 shrink-0 px-3 py-2.5">Start</div>
          <div className="w-28 shrink-0 px-3 py-2.5" title="Working days">
            Duration
          </div>
          <div className="w-32 shrink-0 px-3 py-2.5">Finish</div>
        </div>

        {rows.length <= 1 && filtering ? (
          <div className="px-5 py-14 text-center">
            <p className="font-medium text-gray-900">Nothing matches</p>
            <p className="mt-1 text-sm text-gray-500">
              {onlyNow && !q ? 'No sub-tasks are under way right now.' : 'Try a different search.'}
            </p>
          </div>
        ) : (
          <ul>
            {rows.map(({ node, depth, childCount }) => {
              const level = getProgramLevel(node.level);
              const schedule = schedules[node.id];
              const isLeaf = node.level === LEAF_LEVEL;
              const open = visible ? true : expanded.has(node.id);
              const now = isLeaf && isOnNow(schedule, today);
              const dates = schedule?.scheduled && schedule.start && schedule.finish;
              // Parent dates are rolled up from their sub-tasks, so they read quieter.
              const dateTone = isLeaf ? 'text-gray-700' : 'text-gray-500';
              const requests = requestCounts.get(node.id) ?? 0;

              const content = (
                <>
                  <div
                    className="flex min-w-0 flex-1 items-center gap-2 py-2.5 pr-3"
                    style={{ paddingLeft: `${12 + depth * 20}px` }}
                  >
                    {childCount > 0 && !visible ? (
                      <button
                        type="button"
                        onClick={() => toggle(node.id)}
                        aria-expanded={open}
                        aria-label={`${open ? 'Collapse' : 'Expand'} ${node.name}`}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                      >
                        <Icon name={open ? 'chevronDown' : 'chevronRight'} className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="w-6 shrink-0" aria-hidden="true" />
                    )}
                    <span className="min-w-0">
                      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={`min-w-0 ${level.name}`}>{node.name}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${level.tag}`}>
                          {level.label}
                        </span>
                        {now && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white">
                            Now
                          </span>
                        )}
                        {childCount > 0 && level.childNoun && (
                          <span className="shrink-0 text-xs text-gray-400">{plural(childCount, level.childNoun)}</span>
                        )}
                        {requests > 0 && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                            {plural(requests, 'request')}
                          </span>
                        )}
                      </span>
                      {/* Phone: dates under the name instead of in columns */}
                      <span className={`mt-0.5 block text-xs sm:hidden ${dates ? 'text-gray-500' : 'text-gray-300'}`}>
                        {dates
                          ? `${formatDate(schedule.start!)} – ${formatDate(schedule.finish!)} · ${formatWorkingDays(schedule.duration ?? 0)}`
                          : 'Not scheduled'}
                      </span>
                    </span>
                  </div>

                  <div className={`hidden w-32 shrink-0 px-3 text-sm sm:block ${dateTone}`}>
                    {dates ? formatDate(schedule.start!) : <span className="text-gray-300">-</span>}
                  </div>
                  <div className={`hidden w-28 shrink-0 px-3 text-sm sm:block ${dateTone}`}>
                    {dates ? formatWorkingDays(schedule.duration ?? 0) : <span className="text-gray-300">-</span>}
                  </div>
                  <div className={`hidden w-32 shrink-0 px-3 text-sm sm:block ${dateTone}`}>
                    {dates ? formatDate(schedule.finish!) : <span className="text-gray-300">-</span>}
                  </div>
                </>
              );

              return (
                <li
                  key={node.id}
                  className={`relative border-b border-gray-100 last:border-b-0 ${level.row}`}
                >
                  <span className={`absolute inset-y-0 left-0 z-10 w-1 ${level.accent}`} aria-hidden="true" />
                  {isLeaf ? (
                    // Sub-tasks open their panel - requests are raised from there.
                    <button
                      type="button"
                      onClick={() => onOpen(node.id)}
                      className="flex w-full flex-col text-left transition-colors hover:bg-blue-50/60 focus-visible:bg-blue-50/60 focus-visible:outline-none sm:flex-row sm:items-center"
                    >
                      {content}
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Open a sub-task to request labour, materials or machinery for it. Durations are in working days - Sundays and holidays on the site calendar don’t count. Section and task dates
        are worked out from their sub-tasks.
      </p>
    </div>
  );
}

export default ProgramTree;
