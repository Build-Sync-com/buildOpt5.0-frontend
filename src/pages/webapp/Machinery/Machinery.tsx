import { useEffect, useMemo, useState } from 'react';
import Icon from '../../../components/common/Icon/Icon';
import PageHeader from '../../../components/webapp/layout/PageHeader/PageHeader';
import MachineryStats from '../../../components/webapp/machinery/MachineryStats/MachineryStats';
import FleetBoard from '../../../components/webapp/machinery/FleetBoard/FleetBoard';
import ToolList from '../../../components/webapp/machinery/ToolList/ToolList';
import CheckoutList from '../../../components/webapp/machinery/CheckoutList/CheckoutList';
import MovementLog from '../../../components/webapp/machinery/MovementLog/MovementLog';
import MachinePanel from '../../../components/webapp/machinery/MachinePanel/MachinePanel';
import ToolPanel from '../../../components/webapp/machinery/ToolPanel/ToolPanel';
import ReceiveEquipmentForm from '../../../components/webapp/machinery/ReceiveEquipmentForm/ReceiveEquipmentForm';
import ReturnForm from '../../../components/webapp/machinery/ReturnForm/ReturnForm';
import CheckoutForm from '../../../components/webapp/machinery/CheckoutForm/CheckoutForm';
import CheckInForm from '../../../components/webapp/machinery/CheckInForm/CheckInForm';
import {
  accentButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../../components/webapp/materials/formStyles';
import { machineryRoles } from '../../../constants/machinery';
import { useAuth } from '../../../context/auth/useAuth';
import { useMachineryStore } from '../../../hooks/useMachineryStore';
import { checkoutOverdue, ownersOnSite, summarizeMachines, summarizeTools } from '../../../utils/machinery';
import { formatDate } from '../../../utils/materials';
import type {
  CheckoutDraft,
  EquipmentReceiptDraft,
  EquipmentReturnDraft,
  MachineLogDraft,
  ToolCheckIn,
} from '../../../types/machinery';

/**
 * Machinery & equipment.
 *
 * Machines are tracked unit by unit from the day they arrive to the day
 * they're off-hired: status, meter and hire cost. Tools are counted: received
 * in lots, lent to workers on tool slips and checked back in, then sent back
 * to their owner. Only the roles in constants/machinery.ts record anything -
 * everyone else views.
 */
type Tab = 'machines' | 'tools' | 'slips' | 'movements';

type OpenForm =
  | { kind: 'receive'; toolId?: string }
  | { kind: 'return'; machineId?: string; toolId?: string }
  | { kind: 'checkout'; toolId?: string }
  | { kind: 'checkin'; checkoutId: string };

/** Panel to reopen once a form started from it closes. */
type ReturnTo = { kind: 'machine' | 'tool'; id: string } | null;

function uniqueSorted(values: (string | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))].sort((a, b) => a.localeCompare(b));
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function Machinery() {
  const { session } = useAuth();
  const { state, addTool, receive, logMachine, extendHire, sendBack, checkout, checkIn } = useMachineryStore();

  const [tab, setTab] = useState<Tab>('machines');
  const [openMachineId, setOpenMachineId] = useState<string | null>(null);
  const [openToolId, setOpenToolId] = useState<string | null>(null);
  const [form, setForm] = useState<OpenForm | null>(null);
  const [returnTo, setReturnTo] = useState<ReturnTo>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const machines = useMemo(() => summarizeMachines(state), [state]);
  const tools = useMemo(() => summarizeTools(state), [state]);
  const owners = useMemo(() => ownersOnSite(machines, tools), [machines, tools]);
  const knownOwners = useMemo(() => uniqueSorted(state.receipts.map((r) => r.owner)), [state.receipts]);
  const people = useMemo(() => uniqueSorted(state.checkouts.map((c) => c.issuedTo)), [state.checkouts]);
  const workAreas = useMemo(() => uniqueSorted(state.checkouts.map((c) => c.workArea)), [state.checkouts]);
  const regNosOnSite = useMemo(
    () => machines.filter((m) => !m.returned).map((m) => m.machine.regNo),
    [machines],
  );

  // RequireAuth guarantees a session; this just narrows the type.
  if (!session) return null;
  const canManage = machineryRoles.includes(session.role.id);

  const openMachine = machines.find((m) => m.machine.id === openMachineId) ?? null;
  const openTool = tools.find((t) => t.tool.id === openToolId) ?? null;
  const checkInSlip = form?.kind === 'checkin' ? state.checkouts.find((c) => c.id === form.checkoutId) : undefined;
  const openSlips = state.checkouts.filter((c) => !c.checkIn);
  const lateSlips = openSlips.filter((c) => checkoutOverdue(c)).length;

  const openFormFromPanel = (next: OpenForm, from: NonNullable<ReturnTo>) => {
    setOpenMachineId(null);
    setOpenToolId(null);
    setReturnTo(from);
    setForm(next);
  };

  const closeForm = () => {
    if (returnTo?.kind === 'machine') setOpenMachineId(returnTo.id);
    if (returnTo?.kind === 'tool') setOpenToolId(returnTo.id);
    setReturnTo(null);
    setForm(null);
  };

  const handleReceive = (draft: EquipmentReceiptDraft) => {
    const ernNo = receive(draft);
    const pieces = draft.tools.reduce((sum, t) => sum + t.quantity, 0);
    const parts = [
      draft.machines.length && plural(draft.machines.length, 'machine', 'machines'),
      pieces && plural(pieces, 'tool', 'tools'),
    ].filter(Boolean);
    setToast(`ERN ${ernNo} recorded - ${parts.join(' and ')} now on site.`);
    closeForm();
  };

  const handleReturn = (draft: EquipmentReturnDraft) => {
    const rtnNo = sendBack(draft);
    const pieces = draft.tools.reduce((sum, t) => sum + t.quantity, 0);
    const parts = [
      draft.machines.length && plural(draft.machines.length, 'machine', 'machines'),
      pieces && plural(pieces, 'tool', 'tools'),
    ].filter(Boolean);
    setToast(`RTN ${rtnNo} recorded - ${parts.join(' and ')} sent back to ${draft.owner}.`);
    // A machine's panel reopens on its new "Sent back" record.
    closeForm();
  };

  const handleCheckout = (draft: CheckoutDraft) => {
    const slipNo = checkout(draft);
    const pieces = draft.lines.reduce((sum, l) => sum + l.quantity, 0);
    setToast(`Slip ${slipNo} - ${plural(pieces, 'tool', 'tools')} out with ${draft.issuedTo}.`);
    closeForm();
  };

  const handleCheckIn = (checkoutId: string, draft: ToolCheckIn) => {
    checkIn(checkoutId, draft);
    const slip = state.checkouts.find((c) => c.id === checkoutId);
    const missing = draft.lines.reduce((sum, l) => sum + l.missing, 0);
    const damaged = draft.lines.reduce((sum, l) => sum + l.damaged, 0);
    const outcome =
      missing || damaged
        ? [missing && `${missing} missing`, damaged && `${damaged} damaged`].filter(Boolean).join(', ')
        : 'all back in good order';
    setToast(`Slip ${slip?.slipNo} checked in - ${outcome}.`);
    closeForm();
  };

  const handleLog = (draft: MachineLogDraft) => {
    logMachine(draft);
    setToast('Added to the machine log.');
  };

  const handleExtend = (machineId: string, dueBack: string) => {
    extendHire(machineId, dueBack, session.username);
    setToast(`Off-hire date set to ${formatDate(dueBack)}.`);
  };

  const tabs: { id: Tab; label: string; count: number; alert?: boolean }[] = [
    { id: 'machines', label: 'Machines', count: machines.filter((m) => !m.returned).length },
    { id: 'tools', label: 'Tools', count: tools.filter((t) => t.onSite > 0).length },
    { id: 'slips', label: 'Tool slips', count: openSlips.length, alert: lateSlips > 0 },
    { id: 'movements', label: 'Movements', count: state.receipts.length + state.returns.length },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        title="Machinery & equipment"
        description="Plant on hire and tools in the store - what’s here, who has it, and what it’s costing."
        actions={
          canManage && (
            <>
              <button type="button" onClick={() => setForm({ kind: 'receive' })} className={primaryButtonClass}>
                <Icon name="arrowDownToLine" className="h-4 w-4" />
                Receive equipment
              </button>
              <button type="button" onClick={() => setForm({ kind: 'checkout' })} className={accentButtonClass}>
                <Icon name="arrowUpFromLine" className="h-4 w-4" />
                Check out tools
              </button>
              <button
                type="button"
                onClick={() => setForm({ kind: 'return' })}
                disabled={owners.length === 0}
                className={secondaryButtonClass}
              >
                <Icon name="undo" className="h-4 w-4" />
                Send back
              </button>
            </>
          )
        }
      />

      {!canManage && (
        <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-600">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          You can view machinery and tools. Arrivals, returns and tool slips are recorded by the store keeper and
          site engineers.
        </p>
      )}

      <MachineryStats machines={machines} tools={tools} checkouts={state.checkouts} />

      {/* Tabs */}
      <div className="mt-10 overflow-x-auto border-b border-gray-200" role="tablist" aria-label="Machinery views">
        <div className="-mb-px flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`machinery-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`machinery-panel-${t.id}`}
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
                    ? 'bg-red-50 text-red-700'
                    : tab === t.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6" role="tabpanel" id={`machinery-panel-${tab}`} aria-labelledby={`machinery-tab-${tab}`}>
        {tab === 'machines' && <FleetBoard machines={machines} onOpen={setOpenMachineId} />}
        {tab === 'tools' && <ToolList tools={tools} onOpen={setOpenToolId} />}
        {tab === 'slips' && (
          <CheckoutList
            checkouts={state.checkouts}
            tools={state.tools}
            canManage={canManage}
            onCheckIn={(checkoutId) => setForm({ kind: 'checkin', checkoutId })}
            onOpenTool={setOpenToolId}
          />
        )}
        {tab === 'movements' && (
          <MovementLog state={state} onOpenMachine={setOpenMachineId} onOpenTool={setOpenToolId} />
        )}
      </div>

      <MachinePanel
        summary={openMachine}
        receipt={state.receipts.find((r) => r.id === openMachine?.machine.receiptId)}
        canManage={canManage}
        loggedBy={session.username}
        onClose={() => setOpenMachineId(null)}
        onLog={handleLog}
        onExtend={handleExtend}
        onSendBack={(machineId) =>
          openFormFromPanel({ kind: 'return', machineId }, { kind: 'machine', id: machineId })
        }
      />
      <ToolPanel
        stock={openTool}
        state={state}
        canManage={canManage}
        onClose={() => setOpenToolId(null)}
        onReceive={(toolId) => openFormFromPanel({ kind: 'receive', toolId }, { kind: 'tool', id: toolId })}
        onCheckout={(toolId) => openFormFromPanel({ kind: 'checkout', toolId }, { kind: 'tool', id: toolId })}
        onSendBack={(toolId) => openFormFromPanel({ kind: 'return', toolId }, { kind: 'tool', id: toolId })}
      />

      {form?.kind === 'receive' && (
        <ReceiveEquipmentForm
          tools={state.tools}
          owners={knownOwners}
          regNosOnSite={regNosOnSite}
          receivedBy={session.username}
          initialToolId={form.toolId}
          onAddTool={addTool}
          onSubmit={handleReceive}
          onClose={closeForm}
        />
      )}
      {form?.kind === 'return' && (
        <ReturnForm
          machines={machines}
          tools={tools}
          owners={owners}
          returnedBy={session.username}
          initialMachineId={form.machineId}
          initialToolId={form.toolId}
          onSubmit={handleReturn}
          onClose={closeForm}
        />
      )}
      {form?.kind === 'checkout' && (
        <CheckoutForm
          tools={tools}
          people={people}
          workAreas={workAreas}
          issuedBy={session.username}
          initialToolId={form.toolId}
          onSubmit={handleCheckout}
          onClose={closeForm}
        />
      )}
      {checkInSlip && (
        <CheckInForm
          checkout={checkInSlip}
          tools={state.tools}
          receivedBy={session.username}
          onSubmit={handleCheckIn}
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

export default Machinery;
