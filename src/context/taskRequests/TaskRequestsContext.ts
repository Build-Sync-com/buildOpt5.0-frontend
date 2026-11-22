import { createContext } from 'react';
import type {
  EquipmentRequest,
  EquipmentRequestDraft,
  LaborRequest,
  LaborRequestDraft,
  MaterialRequest,
  MaterialRequestDraft,
} from '../../types/taskRequests';

export type TaskRequestsContextValue = {
  laborRequests: LaborRequest[];
  materialRequests: MaterialRequest[];
  equipmentRequests: EquipmentRequest[];
  /** Raise a labour request; returns it with its new number. */
  requestLabor: (draft: LaborRequestDraft) => LaborRequest;
  /** Raise a material request; returns it with its new number. */
  requestMaterials: (draft: MaterialRequestDraft) => MaterialRequest;
  /** Raise a machinery & equipment request; returns it with its new number. */
  requestEquipment: (draft: EquipmentRequestDraft) => EquipmentRequest;
};

export const TaskRequestsContext = createContext<TaskRequestsContextValue | null>(null);
