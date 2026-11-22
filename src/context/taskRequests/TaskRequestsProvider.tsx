import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { TaskRequestsContext } from './TaskRequestsContext';
import {
  FIRST_EQUIPMENT_REQUEST_NO,
  FIRST_LABOR_REQUEST_NO,
  FIRST_MATERIAL_REQUEST_NO,
} from '../../constants/taskRequests';
import { newId, nextDocNo, todayISO } from '../../utils/materials';
import type {
  EquipmentRequest,
  EquipmentRequestDraft,
  LaborRequest,
  LaborRequestDraft,
  MaterialRequest,
  MaterialRequestDraft,
} from '../../types/taskRequests';

/**
 * TaskRequestsProvider
 *
 * Requests raised against sub-tasks of the program - labour, materials, and
 * machinery & equipment - shared across the web app: raised on the Tasks
 * page, shown on the Labor, Materials and Machinery pages. Each kind is
 * numbered on its own (LR, MR, EQ). Mounted in the web app layout, so
 * requests survive moving between pages.
 *
 * State lives in memory until the requests API exists - swap these for API
 * calls then; pages only use what useTaskRequests returns.
 */
type Numbered = { requestNo: number };

function stamp<D, R extends Numbered>(draft: D, existing: R[], first: number) {
  return {
    ...draft,
    id: newId(),
    requestNo: nextDocNo(existing.map((r) => r.requestNo), first),
    requestedOn: todayISO(),
  };
}

export function TaskRequestsProvider({ children }: { children: ReactNode }) {
  const [laborRequests, setLaborRequests] = useState<LaborRequest[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [equipmentRequests, setEquipmentRequests] = useState<EquipmentRequest[]>([]);

  const requestLabor = useCallback(
    (draft: LaborRequestDraft): LaborRequest => {
      const request = stamp(draft, laborRequests, FIRST_LABOR_REQUEST_NO);
      setLaborRequests((prev) => [...prev, request]);
      return request;
    },
    [laborRequests],
  );

  const requestMaterials = useCallback(
    (draft: MaterialRequestDraft): MaterialRequest => {
      const request = stamp(draft, materialRequests, FIRST_MATERIAL_REQUEST_NO);
      setMaterialRequests((prev) => [...prev, request]);
      return request;
    },
    [materialRequests],
  );

  const requestEquipment = useCallback(
    (draft: EquipmentRequestDraft): EquipmentRequest => {
      const request = stamp(draft, equipmentRequests, FIRST_EQUIPMENT_REQUEST_NO);
      setEquipmentRequests((prev) => [...prev, request]);
      return request;
    },
    [equipmentRequests],
  );

  const value = useMemo(
    () => ({
      laborRequests,
      materialRequests,
      equipmentRequests,
      requestLabor,
      requestMaterials,
      requestEquipment,
    }),
    [laborRequests, materialRequests, equipmentRequests, requestLabor, requestMaterials, requestEquipment],
  );

  return <TaskRequestsContext.Provider value={value}>{children}</TaskRequestsContext.Provider>;
}
