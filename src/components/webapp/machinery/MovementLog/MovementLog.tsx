import { useMemo, useState } from 'react';
import Icon from '../../../common/Icon/Icon';
import DateTile from '../../materials/DateTile/DateTile';
import { FuelGauge } from '../FuelGauge/FuelGauge';
import { RegPlate } from '../FleetBoard/FleetBoard';
import { inputClass } from '../../materials/formStyles';
import { getCondition, getMachineCategory } from '../../../../constants/machinery';
import { formatMeter, formatPieces, formatRate } from '../../../../utils/machinery';
import { formatAgo, formatCurrency } from '../../../../utils/materials';
import type { EquipmentReceipt, EquipmentReturn, MachineryState } from '../../../../types/machinery';

/**
 * MovementLog
 *
 * The site's equipment paper trail, newest first: every received note (what
 * arrived and from whom) and every return note (what went back, in what
 * state, and the hire it ran up).
 */
type Filter = 'all' | 'in' | 'out';

type Entry =
  | { kind: 'in'; date: string; no: number; doc: EquipmentReceipt }
  | { kind: 'out'; date: string; no: number; doc: EquipmentReturn };

type MovementLogProps = {
  state: MachineryState;
  onOpenMachine: (machineId: string) => void;
  onOpenTool: (toolId: string) => void;
};

const rowClass =
  'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 text-left transition-colors sm:px-5';

function MovementLog({ state, onOpenMachine, onOpenTool }: MovementLogProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const machineById = useMemo(() => new Map(state.machines.map((m) => [m.id, m])), [state.machines]);
  const toolById = useMemo(() => new Map(state.tools.map((t) => [t.id, t])), [state.tools]);
  const lotById = useMemo(() => new Map(state.lots.map((l) => [l.id, l])), [state.lots]);

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all: Entry[] = [
      ...state.receipts.map((doc) => ({ kind: 'in' as const, date: doc.receivedOn, no: doc.ernNo, doc })),
      ...state.returns.map((doc) => ({ kind: 'out' as const, date: doc.returnedOn, no: doc.rtnNo, doc })),
    ];

    return all
      .filter((e) => filter === 'all' || e.kind === filter)
      .filter((e) => {
        if (!q) return true;
        const machineIds = e.kind === 'in' ? e.doc.machineIds : e.doc.machines.map((m) => m.machineId);
        const toolIds =
          e.kind === 'in'
            ? e.doc.lotIds.map((id) => lotById.get(id)?.toolId)
            : e.doc.tools.map((t) => t.toolId);
        const haystack = [
          `${e.kind === 'in' ? 'ern' : 'rtn'} ${e.no}`,
          e.doc.owner,
          e.doc.reference,
          e.doc.vehicleNo,
          ...machineIds.flatMap((id) => {
            const m = machineById.get(id);
            return m ? [m.type, m.model, m.regNo] : [];
          }),
          ...toolIds.map((id) => (id ? toolById.get(id)?.name : '')),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date) || (a.kind === b.kind ? b.no - a.no : a.kind === 'out' ? -1 : 1));
  }, [state.receipts, state.returns, filter, query, machineById, toolById, lotById]);

  const chips: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All movements', count: state.receipts.length + state.returns.length },
    { id: 'in', label: 'Received', count: state.receipts.length },
    { id: 'out', label: 'Sent back', count: state.returns.length },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              aria-pressed={filter === chip.id}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === chip.id
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {chip.label}
              <span
                className={`rounded-full px-1.5 text-xs ${filter === chip.id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}
              >
                {chip.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-80">
          <Icon
            name="search"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search note no., owner, machine or tool"
            aria-label="Search movements"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 px-5 py-14 text-center">
          <p className="font-medium text-gray-900">No movements found</p>
          <p className="mt-1 text-sm text-gray-500">Try a different search or filter.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {entries.map((entry) => {
            if (entry.kind === 'in') {
              const { doc } = entry;
              const meta = [
                doc.ownership === 'hired' ? 'Hired' : 'Company-owned',
                doc.reference,
                doc.vehicleNo,
                doc.hireOrder,
                `Received by ${doc.receivedBy}`,
              ].filter(Boolean);
              return (
                <li key={doc.id} className="rounded-2xl border border-gray-200 bg-white">
                  <div className="flex gap-4 p-4 sm:p-5">
                    <DateTile date={doc.receivedOn} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">
                        <span className="text-blue-600">ERN {doc.ernNo}</span>
                        <span className="text-gray-300"> · </span>
                        {doc.owner}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {meta.join(' · ')}
                        <span className="text-gray-400"> · {formatAgo(doc.receivedOn)}</span>
                      </p>
                    </div>
                  </div>
                  <ul className="divide-y divide-gray-100 border-t border-dashed border-gray-200">
                    {doc.machineIds.map((id) => {
                      const machine = machineById.get(id);
                      if (!machine) return null;
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => onOpenMachine(id)}
                            className={`${rowClass} hover:bg-blue-50/40 sm:grid-cols-[minmax(0,1fr)_auto_10rem]`}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <Icon
                                name={getMachineCategory(machine.category).icon}
                                className="h-4 w-4 shrink-0 text-blue-600"
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-gray-900">{machine.type}</span>
                                <span className="block truncate text-xs text-gray-500">{machine.model}</span>
                              </span>
                            </span>
                            <RegPlate regNo={machine.regNo} />
                            <span className="col-span-2 text-xs text-gray-500 sm:col-span-1 sm:text-right">
                              {machine.rate ? formatRate(machine.rate) : 'Company-owned'}
                              {machine.meterIn !== undefined && (
                                <span className="block text-gray-400">
                                  In at {formatMeter(machine.meterIn, machine.meter)}
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                    {doc.lotIds.map((id) => {
                      const lot = lotById.get(id);
                      const tool = lot && toolById.get(lot.toolId);
                      if (!lot || !tool) return null;
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => onOpenTool(tool.id)}
                            className={`${rowClass} hover:bg-blue-50/40 sm:grid-cols-[minmax(0,1fr)_auto_10rem]`}
                          >
                            <span className="min-w-0 pl-7">
                              <span className="block truncate text-sm font-medium text-gray-900">{tool.name}</span>
                              <span className="block truncate text-xs text-gray-500">
                                {tool.spec}
                                {lot.remarks && <span className="text-gray-400"> · {lot.remarks}</span>}
                              </span>
                            </span>
                            <span className="text-sm font-semibold text-blue-700">+{formatPieces(lot.quantity)}</span>
                            <span className="col-span-2 text-xs text-gray-500 sm:col-span-1 sm:text-right">
                              {lot.dailyRate ? `${formatCurrency(lot.dailyRate)} / piece / day` : 'No hire'}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            }

            const { doc } = entry;
            const meta = [doc.reference, doc.vehicleNo, doc.remarks, `Sent by ${doc.returnedBy}`].filter(Boolean);
            const hire = doc.machines.reduce((sum, m) => sum + m.hireCost, 0);
            return (
              <li key={doc.id} className="rounded-2xl border border-gray-200 bg-white">
                <div className="flex gap-4 p-4 sm:p-5">
                  <DateTile date={doc.returnedOn} tone="amber" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="font-semibold text-gray-900">
                        <span className="text-amber-700">RTN {doc.rtnNo}</span>
                        <span className="text-gray-300"> · </span>
                        {doc.owner}
                      </p>
                      {hire > 0 && (
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(hire)} <span className="font-normal text-gray-400">machine hire</span>
                        </p>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {meta.join(' · ')}
                      <span className="text-gray-400"> · {formatAgo(doc.returnedOn)}</span>
                    </p>
                  </div>
                </div>
                <ul className="divide-y divide-gray-100 border-t border-dashed border-gray-200">
                  {doc.machines.map((line) => {
                    const machine = machineById.get(line.machineId);
                    if (!machine) return null;
                    return (
                      <li key={line.machineId}>
                        <button
                          type="button"
                          onClick={() => onOpenMachine(machine.id)}
                          className={`${rowClass} hover:bg-amber-50/40 sm:grid-cols-[minmax(0,1fr)_auto_10rem]`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <Icon
                              name={getMachineCategory(machine.category).icon}
                              className="h-4 w-4 shrink-0 text-amber-600"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-gray-900">
                                {machine.type} <span className="font-normal text-gray-400">· {machine.regNo}</span>
                              </span>
                              <span className="block truncate text-xs text-gray-500">
                                {getCondition(line.conditionOut).label} condition
                                {line.damage && <span className="text-amber-700"> · {line.damage}</span>}
                              </span>
                            </span>
                          </span>
                          <FuelGauge level={line.fuelOut} />
                          <span className="col-span-2 text-xs text-gray-500 sm:col-span-1 sm:text-right">
                            {line.daysOnSite} days on site
                            {machine.ownership === 'hired' && (
                              <span className="block font-semibold text-gray-900">{formatCurrency(line.hireCost)}</span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {doc.tools.map((line) => {
                    const tool = toolById.get(line.toolId);
                    if (!tool) return null;
                    return (
                      <li key={line.lotId}>
                        <button
                          type="button"
                          onClick={() => onOpenTool(tool.id)}
                          className={`${rowClass} hover:bg-amber-50/40 sm:grid-cols-[minmax(0,1fr)_auto_10rem]`}
                        >
                          <span className="min-w-0 pl-7">
                            <span className="block truncate text-sm font-medium text-gray-900">{tool.name}</span>
                            <span className="block truncate text-xs text-gray-500">{tool.spec}</span>
                          </span>
                          <span className="text-sm font-semibold text-gray-900">−{formatPieces(line.quantity)}</span>
                          <span className="col-span-2 text-xs sm:col-span-1 sm:text-right">
                            {line.damaged > 0 ? (
                              <span className="font-medium text-amber-700">{line.damaged} damaged</span>
                            ) : (
                              <span className="text-gray-500">Good order</span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default MovementLog;
