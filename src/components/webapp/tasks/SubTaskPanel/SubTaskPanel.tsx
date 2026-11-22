import Icon from '../../../common/Icon/Icon';
import type { IconName } from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../../materials/SectionHeading/SectionHeading';
import { formatWorkingDays } from '../../../../utils/program';
import {
  equipmentRequestCode,
  formatEquipmentLines,
  formatLaborLines,
  formatMaterialLines,
  laborRequestCode,
  materialRequestCode,
  requestStatusLabels,
} from '../../../../utils/taskRequests';
import { formatDate, formatDayMonth, todayISO } from '../../../../utils/materials';
import type { Tool } from '../../../../types/machinery';
import type { Material } from '../../../../types/materials';
import type { ProgramNode, Schedule } from '../../../../types/program';
import type {
  EquipmentRequest,
  IncomingRequestItem,
  LaborRequest,
  MaterialRequest,
  RequestStatus,
} from '../../../../types/taskRequests';

/**
 * SubTaskPanel
 *
 * One sub-task from the program: where it sits, its dates, and what can be
 * requested for it - labour, materials, or machinery and equipment.
 * Requests already raised for it are listed underneath.
 */
type RequestKind = 'labor' | 'materials' | 'machinery';

type SubTaskPanelProps = {
  task: ProgramNode | null;
  /** Section and task names above it, outermost first. */
  path: string[];
  schedule?: Schedule;
  laborRequests: LaborRequest[];
  materialRequests: MaterialRequest[];
  equipmentRequests: EquipmentRequest[];
  /** The store's materials and the tool list, to name what was requested. */
  materials: Material[];
  tools: Tool[];
  /**
   * Live status of each request, by id: labour from the allocations on the
   * Labor page, materials from issues on the Materials page, and tools from
   * slips on the Machinery page.
   */
  requestProgress: Map<string, IncomingRequestItem>;
  canRequest: boolean;
  onClose: () => void;
  onRequest: (kind: RequestKind, taskId: string) => void;
};

const options: { kind: RequestKind; title: string; hint: string; icon: IconName; ready: boolean }[] = [
  { kind: 'labor', title: 'Request labour', hint: 'Workers by trade, for the days you need them', icon: 'users', ready: true },
  { kind: 'materials', title: 'Request materials', hint: 'Cement, steel, blocks and more from the store', icon: 'package', ready: true },
  { kind: 'machinery', title: 'Request machinery & equipment', hint: 'Plant and tools for the job', icon: 'cog', ready: true },
];

function timing(schedule: Schedule | undefined, today: string) {
  if (!schedule?.scheduled || !schedule.start || !schedule.finish) return null;
  if (today < schedule.start) return { label: 'Upcoming', className: 'bg-gray-100 text-gray-600' };
  if (today > schedule.finish) return { label: 'Past planned finish', className: 'bg-gray-100 text-gray-500' };
  return { label: 'Under way', className: 'bg-blue-50 text-blue-700' };
}

/** One line in the requests list, whatever kind of request it is. */
type RequestItem = {
  id: string;
  icon: IconName;
  code: string;
  summary: string;
  detail: string;
  note?: string;
  requestedBy: string;
  requestedOn: string;
  /** Request number - orders same-day requests of one kind: higher is newer. */
  sequence: number;
  status: RequestStatus;
  progress?: string;
};

const statusStyles: Record<RequestStatus, string> = {
  requested: 'bg-amber-100 text-amber-800',
  'partly-filled': 'bg-blue-50 text-blue-700',
  filled: 'bg-gray-100 text-gray-600',
};

function SubTaskPanel({
  task,
  path,
  schedule,
  laborRequests,
  materialRequests,
  equipmentRequests,
  materials,
  tools,
  requestProgress,
  canRequest,
  onClose,
  onRequest,
}: SubTaskPanelProps) {
  if (!task) return null;
  const today = todayISO();
  const state = timing(schedule, today);

  const requests: RequestItem[] = [
    ...laborRequests.map((r) => ({
      id: r.id,
      icon: 'users' as const,
      code: laborRequestCode(r.requestNo),
      summary: formatLaborLines(r.lines),
      detail: `Labour · ${formatDayMonth(r.neededFrom)}${r.neededTo !== r.neededFrom ? ` – ${formatDayMonth(r.neededTo)}` : ''}`,
      note: r.note,
      requestedBy: r.requestedBy,
      requestedOn: r.requestedOn,
      sequence: r.requestNo,
      status: requestProgress.get(r.id)?.status ?? 'requested',
      progress: requestProgress.get(r.id)?.progress,
    })),
    ...materialRequests.map((r) => ({
      id: r.id,
      icon: 'package' as const,
      code: materialRequestCode(r.requestNo),
      summary: formatMaterialLines(r.lines, materials),
      detail: `Materials · by ${formatDayMonth(r.neededBy)} · to ${r.deliverTo}`,
      note: r.note,
      requestedBy: r.requestedBy,
      requestedOn: r.requestedOn,
      sequence: r.requestNo,
      status: requestProgress.get(r.id)?.status ?? 'requested',
      progress: requestProgress.get(r.id)?.progress,
    })),
    ...equipmentRequests.map((r) => ({
      id: r.id,
      icon: 'cog' as const,
      code: equipmentRequestCode(r.requestNo),
      summary: formatEquipmentLines(r.machines, r.tools, tools),
      detail: `Machinery & equipment · ${formatDayMonth(r.neededFrom)}${
        r.neededTo !== r.neededFrom ? ` – ${formatDayMonth(r.neededTo)}` : ''
      } · ${r.workArea}`,
      note: r.note,
      requestedBy: r.requestedBy,
      requestedOn: r.requestedOn,
      sequence: r.requestNo,
      status: requestProgress.get(r.id)?.status ?? 'requested',
      progress: requestProgress.get(r.id)?.progress,
    })),
  ].sort(
    (a, b) =>
      b.requestedOn.localeCompare(a.requestedOn) ||
      // Numbers only order requests of the same kind (LR, MR and EQ are counted separately).
      (a.icon === b.icon ? b.sequence - a.sequence : 0),
  );

  return (
    <SlideOver
      open
      onClose={onClose}
      eyebrow={path.join(' · ') || 'Sub-task'}
      title={task.name}
      description={state && <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${state.className}`}>{state.label}</span>}
    >
      {/* Schedule */}
      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: 'Start', value: schedule?.start ? formatDate(schedule.start) : '-' },
          { label: 'Finish', value: schedule?.finish ? formatDate(schedule.finish) : '-' },
          { label: 'Duration', value: schedule?.duration ? formatWorkingDays(schedule.duration) : '-' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 p-3.5">
            <dt className="text-xs text-gray-500">{item.label}</dt>
            <dd className="mt-1 font-semibold text-gray-900">{item.value}</dd>
          </div>
        ))}
      </dl>

      {/* Options */}
      <SectionHeading title="Request for this sub-task" className="mt-8" />
      <ul className="mt-4 space-y-2">
        {options.map((opt) => {
          const enabled = canRequest && opt.ready;
          return (
            <li key={opt.kind}>
              <button
                type="button"
                disabled={!enabled}
                onClick={() => onRequest(opt.kind, task.id)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition enabled:hover:border-blue-300 enabled:hover:shadow-md disabled:cursor-not-allowed disabled:bg-gray-50/60"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    enabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Icon name={opt.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-semibold ${enabled ? 'text-gray-900' : 'text-gray-500'}`}>{opt.title}</span>
                  <span className="block text-sm text-gray-500">{opt.hint}</span>
                </span>
                {opt.ready ? (
                  enabled && (
                    <Icon
                      name="chevronRight"
                      className="h-5 w-5 shrink-0 text-gray-300 transition-colors group-hover:text-blue-600"
                    />
                  )
                ) : (
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                    Coming soon
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {!canRequest && (
        <p className="mt-3 flex items-start gap-2 text-xs text-gray-500">
          <Icon name="info" className="mt-px h-3.5 w-3.5 shrink-0" />
          Requests are raised by the engineers and the project manager.
        </p>
      )}

      {/* Requests raised */}
      <SectionHeading
        title="Requests"
        aside={requests.length ? `${requests.length} raised` : undefined}
        className="mt-8"
      />
      {requests.length ? (
        <ul className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200">
          {requests.map((r) => (
            <li key={r.id} className="flex items-start gap-3 px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon name={r.icon} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 text-sm font-medium text-gray-900">{r.summary}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles[r.status]}`}
                  >
                    {requestStatusLabels[r.status]}
                  </span>
                </div>
                <p className="truncate text-xs text-gray-500">{r.detail}</p>
                {r.note && <p className="mt-1 text-sm text-gray-600">{r.note}</p>}
                {r.progress && <p className="mt-1 text-xs text-gray-600">{r.progress}</p>}
                <p className="mt-1 text-xs text-gray-400">
                  {r.code} · {r.requestedBy} · {formatDate(r.requestedOn)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-gray-500">Nothing requested for this sub-task yet.</p>
      )}
    </SlideOver>
  );
}

export default SubTaskPanel;
