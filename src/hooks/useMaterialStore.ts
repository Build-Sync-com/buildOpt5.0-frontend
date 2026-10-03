import { useCallback, useReducer } from 'react';
import { sampleEvents, sampleMaterials } from '../data/sampleMaterials';
import {
  allocateFifo,
  getOpenBatches,
  newId,
  nextDocNo,
  roundQty,
} from '../utils/materials';
import type {
  Batch,
  GoodsReceipt,
  IssueDraft,
  IssueLine,
  Material,
  MaterialIssue,
  MaterialStoreState,
  ReceiptDraft,
} from '../types/materials';

/**
 * useMaterialStore
 *
 * The site's material store: the material list, its batches, and every
 * goods received note and issue note. Receiving turns each accepted line into
 * a new batch; issuing draws from the oldest batches first.
 *
 * State lives in memory until the materials API exists — swap the reducer's
 * callers for API calls then; the page only uses what this hook returns.
 */
const FIRST_GRN_NO = 1031;
const FIRST_ISSUE_NO = 2071;

type Action =
  | { type: 'addMaterial'; material: Material }
  | { type: 'receive'; id: string; batchIds: string[]; draft: ReceiptDraft }
  | { type: 'issue'; id: string; draft: IssueDraft };

function reducer(state: MaterialStoreState, action: Action): MaterialStoreState {
  switch (action.type) {
    case 'addMaterial':
      return { ...state, materials: [...state.materials, action.material] };

    case 'receive': {
      const { draft } = action;
      const grnNo = nextDocNo(state.receipts.map((r) => r.grnNo), FIRST_GRN_NO);
      const receipt: GoodsReceipt = {
        ...draft,
        id: action.id,
        grnNo,
        lines: draft.lines.map((line, i) => ({ ...line, batchId: action.batchIds[i] })),
      };

      const batches: Batch[] = receipt.lines.flatMap((line, i) => {
        const accepted = roundQty(line.quantityDelivered - line.quantityRejected);
        if (accepted <= 0) return [];
        return [
          {
            id: line.batchId,
            materialId: line.materialId,
            receiptId: receipt.id,
            grnNo,
            receivedOn: receipt.receivedOn,
            supplier: receipt.supplier,
            quantityReceived: accepted,
            quantityRemaining: accepted,
            unitCost: line.unitCost,
            location: line.location,
            useBy: line.useBy,
            sequence: state.batches.length + i,
          },
        ];
      });

      return {
        ...state,
        receipts: [...state.receipts, receipt],
        batches: [...state.batches, ...batches],
      };
    }

    case 'issue': {
      const { draft } = action;
      let batches = state.batches;

      const lines: IssueLine[] = draft.lines
        .map((line) => {
          // Only batches that had arrived by the issue date can be drawn from.
          const arrived = getOpenBatches(batches, line.materialId).filter(
            (batch) => batch.receivedOn <= draft.issuedOn,
          );
          const { draws } = allocateFifo(arrived, line.quantity);
          const taken = new Map(draws.map((d) => [d.batchId, d.quantity]));
          batches = batches.map((batch) => {
            const quantity = taken.get(batch.id);
            return quantity
              ? { ...batch, quantityRemaining: roundQty(batch.quantityRemaining - quantity) }
              : batch;
          });
          return {
            materialId: line.materialId,
            quantity: roundQty(draws.reduce((sum, d) => sum + d.quantity, 0)),
            draws: draws.map(({ batchId, quantity }) => ({ batchId, quantity })),
          };
        })
        .filter((line) => line.quantity > 0);

      if (lines.length === 0) return state;

      const issue: MaterialIssue = {
        ...draft,
        id: action.id,
        issueNo: nextDocNo(state.issues.map((i) => i.issueNo), FIRST_ISSUE_NO),
        lines,
      };
      return { ...state, batches, issues: [...state.issues, issue] };
    }
  }
}

function receiveAction(draft: ReceiptDraft): Action {
  return { type: 'receive', id: newId(), batchIds: draft.lines.map(() => newId()), draft };
}

function issueAction(draft: IssueDraft): Action {
  return { type: 'issue', id: newId(), draft };
}

function createSampleState(): MaterialStoreState {
  const empty: MaterialStoreState = {
    materials: sampleMaterials,
    batches: [],
    receipts: [],
    issues: [],
  };
  return sampleEvents.reduce(
    (state, event) =>
      reducer(state, event.kind === 'receive' ? receiveAction(event.draft) : issueAction(event.draft)),
    empty,
  );
}

export function useMaterialStore() {
  const [state, dispatch] = useReducer(reducer, undefined, createSampleState);

  /** Add a material to the list and return it with its new id. */
  const addMaterial = useCallback((draft: Omit<Material, 'id'>): Material => {
    const material = { ...draft, id: newId() };
    dispatch({ type: 'addMaterial', material });
    return material;
  }, []);

  /** Record a delivery; returns the GRN number it'll get. */
  const receive = useCallback(
    (draft: ReceiptDraft): number => {
      dispatch(receiveAction(draft));
      return nextDocNo(state.receipts.map((r) => r.grnNo), FIRST_GRN_NO);
    },
    [state.receipts],
  );

  /** Issue stock FIFO; returns the issue note number it'll get. */
  const issue = useCallback(
    (draft: IssueDraft): number => {
      dispatch(issueAction(draft));
      return nextDocNo(state.issues.map((i) => i.issueNo), FIRST_ISSUE_NO);
    },
    [state.issues],
  );

  return { state, addMaterial, receive, issue };
}
