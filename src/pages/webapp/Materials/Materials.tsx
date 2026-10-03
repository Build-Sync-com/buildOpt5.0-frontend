import { useEffect, useMemo, useState } from 'react';
import Icon from '../../../components/common/Icon/Icon';
import PageHeader from '../../../components/webapp/layout/PageHeader/PageHeader';
import MaterialsStats from '../../../components/webapp/materials/MaterialsStats/MaterialsStats';
import StockList from '../../../components/webapp/materials/StockList/StockList';
import ReceiptLog from '../../../components/webapp/materials/ReceiptLog/ReceiptLog';
import IssueLog from '../../../components/webapp/materials/IssueLog/IssueLog';
import MaterialPanel from '../../../components/webapp/materials/MaterialPanel/MaterialPanel';
import ReceiveForm from '../../../components/webapp/materials/ReceiveForm/ReceiveForm';
import IssueForm from '../../../components/webapp/materials/IssueForm/IssueForm';
import {
  accentButtonClass,
  primaryButtonClass,
} from '../../../components/webapp/materials/formStyles';
import { materialStoreRoles } from '../../../constants/materials';
import { useAuth } from '../../../context/auth/useAuth';
import { useMaterialStore } from '../../../hooks/useMaterialStore';
import { compareFifo, summarizeStock } from '../../../utils/materials';
import type { IssueDraft, ReceiptDraft } from '../../../types/materials';

/**
 * Materials - the site store.
 *
 * Deliveries are received as goods received notes, each accepted item
 * becoming a batch; issues to the work face draw from the oldest batch first.
 * The stock tab shows what's on hand batch by batch; the received and issued
 * tabs are the store's paper trail. Only store roles (see
 * constants/materials.ts) can receive or issue - everyone else views.
 */
type Tab = 'stock' | 'received' | 'issued';

type OpenForm = {
  kind: 'receive' | 'issue';
  materialId?: string;
  /** Reopen this material's panel once the form closes. */
  returnToMaterial?: boolean;
};

function uniqueSorted(values: (string | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function Materials() {
  const { session } = useAuth();
  const { state, addMaterial, receive, issue } = useMaterialStore();

  const [tab, setTab] = useState<Tab>('stock');
  const [openMaterialId, setOpenMaterialId] = useState<string | null>(null);
  const [form, setForm] = useState<OpenForm | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const stock = useMemo(() => summarizeStock(state), [state]);
  const suppliers = useMemo(() => uniqueSorted(state.receipts.map((r) => r.supplier)), [state.receipts]);
  const workAreas = useMemo(() => uniqueSorted(state.issues.map((i) => i.workArea)), [state.issues]);
  const people = useMemo(() => uniqueSorted(state.issues.map((i) => i.issuedTo)), [state.issues]);
  const lastPrices = useMemo(() => {
    const prices = new Map<string, number>();
    [...state.batches].sort(compareFifo).forEach((b) => {
      if (b.unitCost > 0) prices.set(b.materialId, b.unitCost);
    });
    return prices;
  }, [state.batches]);

  // RequireAuth guarantees a session; this just narrows the type.
  if (!session) return null;
  const canManage = materialStoreRoles.includes(session.role.id);
  const openStock = stock.find((s) => s.material.id === openMaterialId) ?? null;

  const openFormFromPanel = (kind: OpenForm['kind'], materialId: string) => {
    setOpenMaterialId(null);
    setForm({ kind, materialId, returnToMaterial: true });
  };

  const closeForm = () => {
    if (form?.returnToMaterial && form.materialId) setOpenMaterialId(form.materialId);
    setForm(null);
  };

  const handleReceive = (draft: ReceiptDraft) => {
    const grnNo = receive(draft);
    const n = draft.lines.length;
    setToast(`GRN ${grnNo} recorded - ${n} new ${n === 1 ? 'batch' : 'batches'} in store.`);
    closeForm();
  };

  const handleIssue = (draft: IssueDraft) => {
    const issueNo = issue(draft);
    setToast(`MIN ${issueNo} recorded - stock taken from the oldest batches first.`);
    closeForm();
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'stock', label: 'Stock', count: stock.length },
    { id: 'received', label: 'Received', count: state.receipts.length },
    { id: 'issued', label: 'Issued', count: state.issues.length },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        title="Materials"
        description="Deliveries in, issues out - every batch tracked first in, first out."
        actions={
          canManage && (
            <>
              <button
                type="button"
                onClick={() => setForm({ kind: 'receive' })}
                className={primaryButtonClass}
              >
                <Icon name="arrowDownToLine" className="h-4 w-4" />
                Receive delivery
              </button>
              <button
                type="button"
                onClick={() => setForm({ kind: 'issue' })}
                className={accentButtonClass}
              >
                <Icon name="arrowUpFromLine" className="h-4 w-4" />
                Issue materials
              </button>
            </>
          )
        }
      />

      {!canManage && (
        <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-600">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          You can view the store. Deliveries and issues are recorded by the store keeper.
        </p>
      )}

      <MaterialsStats stock={stock} />

      {/* Tabs */}
      <div className="mt-10 border-b border-gray-200" role="tablist" aria-label="Materials views">
        <div className="-mb-px flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`materials-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`materials-panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-0.5 pb-3 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  tab === t.id ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="mt-6"
        role="tabpanel"
        id={`materials-panel-${tab}`}
        aria-labelledby={`materials-tab-${tab}`}
      >
        {tab === 'stock' && <StockList stock={stock} onOpen={setOpenMaterialId} />}
        {tab === 'received' && <ReceiptLog state={state} onOpenMaterial={setOpenMaterialId} />}
        {tab === 'issued' && <IssueLog state={state} onOpenMaterial={setOpenMaterialId} />}
      </div>

      <MaterialPanel
        stock={openStock}
        state={state}
        canManage={canManage}
        onClose={() => setOpenMaterialId(null)}
        onReceive={(id) => openFormFromPanel('receive', id)}
        onIssue={(id) => openFormFromPanel('issue', id)}
      />

      {form?.kind === 'receive' && (
        <ReceiveForm
          materials={state.materials}
          suppliers={suppliers}
          lastPrices={lastPrices}
          receivedBy={session.username}
          initialMaterialId={form.materialId}
          onAddMaterial={addMaterial}
          onSubmit={handleReceive}
          onClose={closeForm}
        />
      )}
      {form?.kind === 'issue' && (
        <IssueForm
          stock={stock}
          workAreas={workAreas}
          people={people}
          issuedBy={session.username}
          initialMaterialId={form.materialId}
          onSubmit={handleIssue}
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

export default Materials;
