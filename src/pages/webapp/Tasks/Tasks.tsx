import { useEffect, useMemo, useState } from 'react';
import Icon from '../../../components/common/Icon/Icon';
import PageHeader from '../../../components/webapp/layout/PageHeader/PageHeader';
import ProgramSummary from '../../../components/webapp/tasks/ProgramSummary/ProgramSummary';
import ProgramTree from '../../../components/webapp/tasks/ProgramTree/ProgramTree';
import SubTaskPanel from '../../../components/webapp/tasks/SubTaskPanel/SubTaskPanel';
import LaborRequestForm from '../../../components/webapp/tasks/LaborRequestForm/LaborRequestForm';
import MaterialRequestForm from '../../../components/webapp/tasks/MaterialRequestForm/MaterialRequestForm';
import EquipmentRequestForm from '../../../components/webapp/tasks/EquipmentRequestForm/EquipmentRequestForm';
import { taskRequestRoles } from '../../../constants/taskRequests';
import { useAuth } from '../../../context/auth/useAuth';
import { useLabor } from '../../../context/labor/useLabor';
import { useMachinery } from '../../../context/machinery/useMachinery';
import { useMaterials } from '../../../context/materials/useMaterials';
import { useProgram } from '../../../hooks/useProgram';
import { useTaskRequests } from '../../../context/taskRequests/useTaskRequests';
import { summarizeMachines, summarizeTools } from '../../../utils/machinery';
import { summarizeStock } from '../../../utils/materials';
import { computeSchedules, taskPath } from '../../../utils/program';
import {
  equipmentRequestCode,
  formatEquipmentLines,
  formatLaborLines,
  formatMaterialLines,
  laborRequestCode,
  laborRequestItems,
  materialRequestItems,
  equipmentRequestItems,
  materialRequestCode,
} from '../../../utils/taskRequests';
import type { ProgramNode } from '../../../types/program';
import type {
  EquipmentRequestDraft,
  LaborRequestDraft,
  MaterialRequestDraft,
} from '../../../types/taskRequests';

/**
 * Tasks.
 *
 * The site's construction program - main task, sections, tasks and
 * sub-tasks with their dates - exactly as the planning team built it in the
 * admin portal. The program itself is read-only here; costs from the admin
 * portal aren't shown. Clicking a sub-task opens it, and the roles in
 * constants/taskRequests.ts can request labour, materials, or machinery
 * and equipment for it.
 */
type OpenForm = { kind: 'labor' | 'materials' | 'machinery'; taskId: string };

function Tasks() {
  const { session } = useAuth();
  const { tasks, holidays } = useProgram();
  const {
    laborRequests,
    materialRequests,
    equipmentRequests,
    requestLabor,
    requestMaterials,
    requestEquipment,
  } = useTaskRequests();
  // The store's catalog and stock, so material requests pick from what the store keeps.
  const { state: storeState } = useMaterials();
  const stock = useMemo(() => summarizeStock(storeState), [storeState]);
  // The fleet and tool store, so equipment requests show what's on site.
  const { state: machineryState } = useMachinery();
  const fleet = useMemo(() => summarizeMachines(machineryState), [machineryState]);
  const toolStock = useMemo(() => summarizeTools(machineryState), [machineryState]);

  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [form, setForm] = useState<OpenForm | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Allocations on the Labor page fill labour requests; show how far each has got.
  const { state: laborState } = useLabor();

  const holidaySet = useMemo(() => new Set(holidays), [holidays]);
  const schedules = useMemo(() => computeSchedules(tasks, holidaySet), [tasks, holidaySet]);
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  // Allocations (Labor), issues (Materials) and tool slips (Machinery) fill requests; show how far each has got.
  const requestProgress = useMemo(
    () =>
      new Map(
        [
          ...laborRequestItems(laborRequests, byId, laborState),
          ...materialRequestItems(materialRequests, byId, storeState),
          ...equipmentRequestItems(equipmentRequests, byId, machineryState),
        ].map((i) => [i.id, i]),
      ),
    [laborRequests, materialRequests, equipmentRequests, byId, laborState, storeState, machineryState],
  );
  const requestCounts = useMemo(() => {
    const counts = new Map<string, number>();
    [...laborRequests, ...materialRequests, ...equipmentRequests].forEach((r) =>
      counts.set(r.taskId, (counts.get(r.taskId) ?? 0) + 1),
    );
    return counts;
  }, [laborRequests, materialRequests, equipmentRequests]);
  const root = tasks.find((t) => t.parentId === null);

  // RequireAuth guarantees a session; this just narrows the type.
  if (!session) return null;
  const canRequest = taskRequestRoles.includes(session.role.id);

  const pathOf = (task: ProgramNode) => taskPath(byId, task);

  const openTask = openTaskId ? (byId.get(openTaskId) ?? null) : null;
  const formTask = form ? byId.get(form.taskId) : undefined;

  const closeForm = () => {
    if (form) setOpenTaskId(form.taskId);
    setForm(null);
  };

  const handleLaborRequest = (draft: LaborRequestDraft) => {
    const request = requestLabor(draft);
    setToast(
      `${laborRequestCode(request.requestNo)} sent - ${formatLaborLines(draft.lines)} for ${
        byId.get(draft.taskId)?.name ?? 'the sub-task'
      }.`,
    );
    closeForm();
  };

  const handleMaterialRequest = (draft: MaterialRequestDraft) => {
    const request = requestMaterials(draft);
    setToast(
      `${materialRequestCode(request.requestNo)} sent to the store - ${formatMaterialLines(
        draft.lines,
        storeState.materials,
      )}.`,
    );
    closeForm();
  };

  const handleEquipmentRequest = (draft: EquipmentRequestDraft) => {
    const request = requestEquipment(draft);
    setToast(
      `${equipmentRequestCode(request.requestNo)} sent - ${formatEquipmentLines(
        draft.machines,
        draft.tools,
        machineryState.tools,
      )}.`,
    );
    closeForm();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader title="Tasks" description="The construction program for this site - sections, tasks and sub-tasks." />

      {!root ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 px-5 py-16 text-center">
          <p className="font-medium text-gray-900">No program yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            The construction program shows here once the planning team sets it up in the admin portal.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-600">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            This program is set up by the planning team in the admin portal. It can’t be changed here.
          </p>

          <ProgramSummary root={root} tasks={tasks} schedules={schedules} holidays={holidaySet} />

          <div className="mt-10">
            <ProgramTree
              root={root}
              tasks={tasks}
              schedules={schedules}
              requestCounts={requestCounts}
              onOpen={setOpenTaskId}
            />
          </div>
        </>
      )}

      <SubTaskPanel
        task={openTask}
        path={openTask ? pathOf(openTask) : []}
        schedule={openTask ? schedules[openTask.id] : undefined}
        laborRequests={laborRequests.filter((r) => r.taskId === openTaskId)}
        materialRequests={materialRequests.filter((r) => r.taskId === openTaskId)}
        equipmentRequests={equipmentRequests.filter((r) => r.taskId === openTaskId)}
        requestProgress={requestProgress}
        materials={storeState.materials}
        tools={machineryState.tools}
        canRequest={canRequest}
        onClose={() => setOpenTaskId(null)}
        onRequest={(kind, taskId) => {
          setOpenTaskId(null);
          setForm({ kind, taskId });
        }}
      />

      {form?.kind === 'labor' && formTask && (
        <LaborRequestForm
          task={formTask}
          path={pathOf(formTask)}
          schedule={schedules[formTask.id]}
          requestedBy={session.username}
          onSubmit={handleLaborRequest}
          onClose={closeForm}
        />
      )}
      {form?.kind === 'materials' && formTask && (
        <MaterialRequestForm
          task={formTask}
          path={pathOf(formTask)}
          schedule={schedules[formTask.id]}
          stock={stock}
          requestedBy={session.username}
          onSubmit={handleMaterialRequest}
          onClose={closeForm}
        />
      )}
      {form?.kind === 'machinery' && formTask && (
        <EquipmentRequestForm
          task={formTask}
          path={pathOf(formTask)}
          schedule={schedules[formTask.id]}
          machines={fleet}
          tools={toolStock}
          requestedBy={session.username}
          onSubmit={handleEquipmentRequest}
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

export default Tasks;
