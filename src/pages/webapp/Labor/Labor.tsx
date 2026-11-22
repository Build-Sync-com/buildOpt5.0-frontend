import { useEffect, useMemo, useState } from 'react';
import Icon from '../../../components/common/Icon/Icon';
import PageHeader from '../../../components/webapp/layout/PageHeader/PageHeader';
import LaborStats from '../../../components/webapp/labor/LaborStats/LaborStats';
import WorkforceList from '../../../components/webapp/labor/WorkforceList/WorkforceList';
import MusterRoll from '../../../components/webapp/labor/MusterRoll/MusterRoll';
import WorkFronts from '../../../components/webapp/labor/WorkFronts/WorkFronts';
import WorkerPanel from '../../../components/webapp/labor/WorkerPanel/WorkerPanel';
import WorkerForm from '../../../components/webapp/labor/WorkerForm/WorkerForm';
import AllocateForm from '../../../components/webapp/labor/AllocateForm/AllocateForm';
import IncomingRequests from '../../../components/webapp/requests/IncomingRequests/IncomingRequests';
import { useTaskRequests } from '../../../context/taskRequests/useTaskRequests';
import { useProgram } from '../../../hooks/useProgram';
import {
  hasUrgentRequest,
  laborRequestCode,
  laborRequestFill,
  laborRequestItems,
  requestStatusLabels,
} from '../../../utils/taskRequests';
import { accentButtonClass, primaryButtonClass } from '../../../components/webapp/materials/formStyles';
import { activitySuggestions, laborRoles, locationSuggestions } from '../../../constants/labor';
import { useAuth } from '../../../context/auth/useAuth';
import { useLabor } from '../../../context/labor/useLabor';
import { groupWorkFronts, summarizeWorkers, tradeMix, workerCode } from '../../../utils/labor';
import { taskPath } from '../../../utils/program';
import { formatDate, todayISO } from '../../../utils/materials';
import type { AllocationDraft, WorkFront, WorkerDraft, WorkerRelease } from '../../../types/labor';

/**
 * Labor.
 *
 * The site register (who's on site, their details, trade and pay), the
 * daily muster roll, and work allocation (who's on which job, and who's
 * free). Clicking a worker anywhere opens their panel, which leads with
 * what they're doing today. Only the roles in constants/labor.ts record
 * anything - everyone else views.
 */
type Tab = 'workforce' | 'muster' | 'allocation' | 'requests';

type OpenForm =
  | { kind: 'worker'; workerId?: string }
  | {
      kind: 'allocate';
      workerIds?: string[];
      activity?: string;
      location?: string;
      /** Filling this labour request. */
      requestId?: string;
    };

function uniqueSorted(values: (string | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))].sort((a, b) => a.localeCompare(b));
}

function Labor() {
  const { session } = useAuth();
  const { state, addWorker, updateWorker, releaseWorker, allocate, endJobs, markAttendance, unmarkAttendance } =
    useLabor();

  const [tab, setTab] = useState<Tab>('workforce');
  const [openWorkerId, setOpenWorkerId] = useState<string | null>(null);
  const [form, setForm] = useState<OpenForm | null>(null);
  /** Worker panel to reopen once a form started from it closes. */
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Labour requested from sub-tasks on the Tasks page.
  const { laborRequests } = useTaskRequests();
  const { tasks: programTasks } = useProgram();
  const programById = useMemo(() => new Map(programTasks.map((t) => [t.id, t])), [programTasks]);
  const requestItems = useMemo(
    () => laborRequestItems(laborRequests, programById, state),
    [laborRequests, programById, state],
  );

  const workers = useMemo(() => summarizeWorkers(state), [state]);
  const fronts = useMemo(() => groupWorkFronts(workers), [workers]);
  const subcontractors = useMemo(() => uniqueSorted(state.workers.map((w) => w.subcontractor)), [state.workers]);
  const activities = useMemo(
    () => uniqueSorted([...activitySuggestions, ...state.assignments.map((a) => a.activity)]),
    [state.assignments],
  );
  const locations = useMemo(
    () => uniqueSorted([...locationSuggestions, ...state.assignments.map((a) => a.location)]),
    [state.assignments],
  );

  // RequireAuth guarantees a session; this just narrows the type.
  if (!session) return null;
  const canManage = laborRoles.includes(session.role.id);

  const active = workers.filter((w) => !w.worker.release);
  const unmarked = active.filter((w) => !w.today).length;
  const openWorker = workers.find((w) => w.worker.id === openWorkerId) ?? null;
  const editWorker = form?.kind === 'worker' && form.workerId ? state.workers.find((w) => w.id === form.workerId) : undefined;
  const nameOf = (id: string) => {
    const w = state.workers.find((x) => x.id === id);
    return w?.callingName ?? w?.name ?? 'Worker';
  };

  const openFormFromPanel = (next: OpenForm, workerId: string) => {
    setOpenWorkerId(null);
    setReturnTo(workerId);
    setForm(next);
  };

  const closeForm = () => {
    if (returnTo) setOpenWorkerId(returnTo);
    setReturnTo(null);
    setForm(null);
  };

  const handleSaveWorker = (draft: WorkerDraft) => {
    if (editWorker) {
      updateWorker(editWorker.id, draft);
      setToast(`${draft.callingName ?? draft.name}’s details updated.`);
      closeForm();
      return;
    }
    const worker = addWorker(draft);
    setToast(`${draft.name} registered as ${workerCode(worker.workerNo)}.`);
    setForm(null);
    setOpenWorkerId(worker.id);
  };

  const handleAllocate = (draft: AllocationDraft) => {
    allocate(draft);
    const picked = workers.filter((w) => draft.workerIds.includes(w.worker.id));
    const who = picked.length === 1 ? nameOf(picked[0].worker.id) : tradeMix(picked);
    const request = draft.requestId ? laborRequests.find((r) => r.id === draft.requestId) : undefined;
    if (request) {
      // Where the request stands once these allocations are in.
      const fill = laborRequestFill(request, {
        ...state,
        assignments: [
          ...state.assignments,
          ...draft.workerIds.map((workerId) => ({ ...draft, id: '', workerId })),
        ],
      });
      setToast(
        `${who} allocated to ${laborRequestCode(request.requestNo)} - ${requestStatusLabels[fill.status].toLowerCase()}.`,
      );
    } else {
      setToast(`${who} on ${draft.activity.toLowerCase()} at ${draft.location}.`);
    }
    closeForm();
  };

  /** Open the allocation form set up to fill a labour request. */
  const allocateForRequest = (requestId: string) => {
    const request = laborRequests.find((r) => r.id === requestId);
    if (!request) return;
    const task = programById.get(request.taskId);
    const path = task ? taskPath(programById, task) : [];
    setForm({
      kind: 'allocate',
      requestId,
      activity: task?.name,
      // The section, e.g. "Block A" - the engineer can narrow it to the exact spot.
      location: path[0],
    });
  };
  const formRequest =
    form?.kind === 'allocate' && form.requestId ? laborRequests.find((r) => r.id === form.requestId) : undefined;

  const handleFree = (assignmentId: string) => {
    endJobs([assignmentId], todayISO());
    const a = state.assignments.find((x) => x.id === assignmentId);
    if (a) setToast(`${nameOf(a.workerId)} taken off ${a.activity.toLowerCase()} - free to allocate.`);
  };

  const handleFinish = (front: WorkFront) => {
    endJobs(
      front.members.flatMap((m) => (m.assignment ? [m.assignment.id] : [])),
      todayISO(),
    );
    setToast(
      `${front.activity} at ${front.location} finished - ${front.members.length} ${
        front.members.length === 1 ? 'worker' : 'workers'
      } free.`,
    );
  };

  const handleRelease = (workerId: string, release: WorkerRelease) => {
    releaseWorker(workerId, release);
    setToast(`${nameOf(workerId)} released from site on ${formatDate(release.releasedOn)}.`);
  };

  const tabs: { id: Tab; label: string; count: number; alert?: boolean }[] = [
    { id: 'workforce', label: 'Workforce', count: active.length },
    { id: 'muster', label: 'Attendance', count: unmarked, alert: unmarked > 0 },
    { id: 'allocation', label: 'Work allocation', count: fronts.length },
    { id: 'requests', label: 'Requests', count: requestItems.length, alert: hasUrgentRequest(requestItems) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        title="Labor"
        description="Who’s on site, what they’re working on, and who’s free - from the morning muster to the wage bill."
        actions={
          canManage && (
            <>
              <button type="button" onClick={() => setForm({ kind: 'worker' })} className={primaryButtonClass}>
                <Icon name="userPlus" className="h-4 w-4" />
                Register worker
              </button>
              <button type="button" onClick={() => setForm({ kind: 'allocate' })} className={accentButtonClass}>
                <Icon name="arrowRightLeft" className="h-4 w-4" />
                Allocate workers
              </button>
            </>
          )
        }
      />

      {!canManage && (
        <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-600">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          You can view the workforce, attendance and allocations. Workers are registered, mustered and allocated by
          the engineers and site admin.
        </p>
      )}

      <LaborStats workers={workers} />

      {/* Tabs */}
      <div className="mt-10 overflow-x-auto border-b border-gray-200" role="tablist" aria-label="Labor views">
        <div className="-mb-px flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`labor-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`labor-panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-0.5 pb-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  t.alert
                    ? 'bg-amber-100 text-amber-800'
                    : tab === t.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {t.count}
                {t.id === 'muster' && t.alert && <span className="sr-only"> not marked</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6" role="tabpanel" id={`labor-panel-${tab}`} aria-labelledby={`labor-tab-${tab}`}>
        {tab === 'workforce' && <WorkforceList workers={workers} onOpen={setOpenWorkerId} />}
        {tab === 'muster' && (
          <MusterRoll
            workers={workers}
            attendance={state.attendance}
            canManage={canManage}
            markedBy={session.username}
            onMark={markAttendance}
            onUnmark={unmarkAttendance}
            onOpen={setOpenWorkerId}
          />
        )}
        {tab === 'allocation' && (
          <WorkFronts
            workers={active}
            canManage={canManage}
            onOpen={setOpenWorkerId}
            onAllocate={(preset) => setForm({ kind: 'allocate', ...preset })}
            onFinish={handleFinish}
          />
        )}
        {tab === 'requests' && (
          <IncomingRequests
            items={requestItems}
            emptyTitle="No labour requests"
            emptyText="Engineers request workers for a sub-task from the Tasks page. Their requests show up here."
            renderActions={(item) =>
              canManage &&
              item.status !== 'filled' && (
                <button
                  type="button"
                  onClick={() => allocateForRequest(item.id)}
                  className={`${accentButtonClass} px-3 py-1.5`}
                >
                  <Icon name="arrowRightLeft" className="h-4 w-4" />
                  Allocate workers
                </button>
              )
            }
          />
        )}
      </div>

      <WorkerPanel
        summary={openWorker}
        canManage={canManage}
        releasedBy={session.username}
        onClose={() => setOpenWorkerId(null)}
        onAllocate={(workerId) => openFormFromPanel({ kind: 'allocate', workerIds: [workerId] }, workerId)}
        onFree={handleFree}
        onEdit={(workerId) => openFormFromPanel({ kind: 'worker', workerId }, workerId)}
        onRelease={handleRelease}
      />

      {form?.kind === 'worker' && (
        <WorkerForm
          worker={editWorker}
          workers={state.workers}
          subcontractors={subcontractors}
          onSubmit={handleSaveWorker}
          onClose={closeForm}
        />
      )}
      {form?.kind === 'allocate' && (
        <AllocateForm
          workers={active}
          activities={activities}
          locations={locations}
          assignedBy={session.username}
          initialWorkerIds={form.workerIds}
          initialActivity={form.activity}
          initialLocation={form.location}
          initialStartedOn={formRequest && formRequest.neededFrom > todayISO() ? formRequest.neededFrom : undefined}
          initialExpectedEnd={formRequest?.neededTo}
          request={
            formRequest && {
              requestId: formRequest.id,
              code: laborRequestCode(formRequest.requestNo),
              fill: laborRequestFill(formRequest, state),
              neededFrom: formRequest.neededFrom,
              neededTo: formRequest.neededTo,
            }
          }
          onSubmit={handleAllocate}
          onClose={closeForm}
        />
      )}

      {toast && (
        <div
          role="status"
          className="animate-rise-in fixed right-4 bottom-4 z-[60] flex max-w-sm items-start gap-3 rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-xl sm:right-6 sm:bottom-6"
        >
          <Icon name="circleCheck" className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="-mr-1 ml-1 rounded p-0.5 text-gray-400 hover:text-white"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default Labor;
