import { useMemo, useState } from 'react';
import Icon from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../SectionHeading/SectionHeading';
import { StockBadge, UseByBadge } from '../StockBadge/StockBadge';
import { accentButtonClass, primaryButtonClass } from '../formStyles';
import { getCategoryLabel, getUnit } from '../../../../constants/materials';
import {
  compareFifo,
  daysBetween,
  formatCurrency,
  formatDate,
  formatDayMonth,
  formatQuantity,
  todayISO,
  getUseByState,
} from '../../../../utils/materials';
import type {
  Batch,
  MaterialStock,
  MaterialStoreState,
  UnitId,
} from '../../../../types/materials';

/**
 * MaterialPanel
 *
 * One material in detail: stock summary, open batches in the order they'll
 * be issued, used-up batches, and every delivery and issue that touched it.
 */
type MaterialPanelProps = {
  stock: MaterialStock | null;
  state: MaterialStoreState;
  canManage: boolean;
  onClose: () => void;
  onReceive: (materialId: string) => void;
  onIssue: (materialId: string) => void;
};

type HistoryEntry = {
  key: string;
  kind: 'in' | 'out';
  date: string;
  docNo: number;
  quantity: number;
  title: string;
  detail: string;
};

function BatchCard({ batch, position, unitId }: { batch: Batch; position: number; unitId: UnitId }) {
  const isNext = position === 0;
  const daysInStore = daysBetween(batch.receivedOn, todayISO());
  const useBy = getUseByState(batch);
  const usedPct = 100 - (batch.quantityRemaining / batch.quantityReceived) * 100;
  const unit = getUnit(unitId);

  return (
    <li className="group relative flex gap-4 pb-5 last:pb-0">
      {/* Queue marker + connector */}
      <span className="relative flex flex-col items-center">
        <span
          className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            isNext ? 'bg-amber-400 text-gray-900' : 'border border-blue-200 bg-blue-50 text-blue-700'
          }`}
        >
          {position + 1}
        </span>
        <span
          className="absolute top-8 bottom-0 border-l border-dashed border-gray-300 group-last:hidden"
          aria-hidden="true"
        />
      </span>

      <div
        className={`min-w-0 flex-1 rounded-xl border p-4 ${
          isNext ? 'border-amber-300 bg-amber-50/40' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">
              Received {formatDate(batch.receivedOn)}
              {isNext && (
                <span className="ml-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-gray-900">
                  Next out
                </span>
              )}
            </p>
            <p className="mt-0.5 truncate text-sm text-gray-500">
              GRN {batch.grnNo} · {batch.supplier}
            </p>
          </div>
          {useBy && useBy !== 'ok' && <UseByBadge state={useBy} />}
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-3 text-sm">
          <span className="font-semibold text-gray-900">
            {formatQuantity(batch.quantityRemaining, unitId)}{' '}
            <span className="font-normal text-gray-400">
              left of {formatQuantity(batch.quantityReceived, unitId)}
            </span>
          </span>
          <span className="text-xs text-gray-400">
            {daysInStore <= 0 ? 'Arrived today' : `${daysInStore} days in store`}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${isNext ? 'bg-amber-400' : 'bg-blue-600'}`}
            style={{ width: `${100 - usedPct}%` }}
          />
        </div>

        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <dt className="sr-only">Unit price</dt>
            <Icon name="banknote" className="h-3.5 w-3.5 text-gray-400" />
            <dd>
              {batch.unitCost ? `${formatCurrency(batch.unitCost)} / ${unit.label}` : 'Price not entered'}
            </dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">Location</dt>
            <Icon name="mapPin" className="h-3.5 w-3.5 text-gray-400" />
            <dd>{batch.location}</dd>
          </div>
          {batch.useBy && (
            <div className="flex items-center gap-1">
              <dt className="sr-only">Use by</dt>
              <Icon name="clock" className="h-3.5 w-3.5 text-gray-400" />
              <dd>Use by {formatDate(batch.useBy)}</dd>
            </div>
          )}
        </dl>
      </div>
    </li>
  );
}

function MaterialPanel({
  stock,
  state,
  canManage,
  onClose,
  onReceive,
  onIssue,
}: MaterialPanelProps) {
  const [showUsed, setShowUsed] = useState(false);
  const materialId = stock?.material.id;

  const usedBatches = useMemo(
    () =>
      state.batches
        .filter((b) => b.materialId === materialId && b.quantityRemaining <= 0)
        .sort(compareFifo)
        .reverse(),
    [state.batches, materialId],
  );

  const history = useMemo<HistoryEntry[]>(() => {
    if (!materialId) return [];
    const batchById = new Map(state.batches.map((b) => [b.id, b]));

    const ins: HistoryEntry[] = state.receipts.flatMap((receipt) =>
      receipt.lines
        .filter((line) => line.materialId === materialId)
        .map((line) => ({
          key: `in-${line.batchId}`,
          kind: 'in' as const,
          date: receipt.receivedOn,
          docNo: receipt.grnNo,
          quantity: line.quantityDelivered - line.quantityRejected,
          title: receipt.supplier,
          detail: [
            `GRN ${receipt.grnNo}`,
            receipt.deliveryNote,
            line.quantityRejected ? `${line.quantityRejected} rejected` : '',
          ]
            .filter(Boolean)
            .join(' · '),
        })),
    );

    const outs: HistoryEntry[] = state.issues.flatMap((issue) =>
      issue.lines
        .filter((line) => line.materialId === materialId)
        .map((line, i) => ({
          key: `out-${issue.id}-${i}`,
          kind: 'out' as const,
          date: issue.issuedOn,
          docNo: issue.issueNo,
          quantity: line.quantity,
          title: issue.workArea,
          detail: [
            `MIN ${issue.issueNo}`,
            issue.issuedTo,
            `from ${line.draws
              .map((d) => {
                const batch = batchById.get(d.batchId);
                return batch ? `${formatDayMonth(batch.receivedOn)} batch (${d.quantity})` : '';
              })
              .filter(Boolean)
              .join(', ')}`,
          ].join(' · '),
        })),
    );

    return [...ins, ...outs].sort(
      (a, b) => b.date.localeCompare(a.date) || (a.kind === b.kind ? b.docNo - a.docNo : a.kind === 'out' ? -1 : 1),
    );
  }, [state, materialId]);

  if (!stock) return null;
  const { material } = stock;

  return (
    <SlideOver
      open
      onClose={onClose}
      eyebrow={getCategoryLabel(material.category)}
      title={material.name}
      description={material.spec}
      footer={
        canManage && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onIssue(material.id)}
              disabled={stock.onHand <= 0}
              className={accentButtonClass}
            >
              <Icon name="arrowUpFromLine" className="h-4 w-4" />
              Issue from store
            </button>
            <button type="button" onClick={() => onReceive(material.id)} className={primaryButtonClass}>
              <Icon name="arrowDownToLine" className="h-4 w-4" />
              Receive delivery
            </button>
          </div>
        )
      }
    >
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-2 rounded-xl border border-gray-200 p-4 sm:col-span-1">
          <p className="text-xs text-gray-500">On hand</p>
          <p
            className={`mt-1 text-2xl font-bold tracking-tight ${
              stock.status === 'out' ? 'text-red-600' : 'text-gray-900'
            }`}
          >
            {formatQuantity(stock.onHand, material.unit)}
          </p>
          <div className="mt-2">
            <StockBadge status={stock.status} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Reorder level</p>
          <p className="mt-1 font-semibold text-gray-900">
            {formatQuantity(material.reorderLevel, material.unit)}
          </p>
          <p className="mt-2 text-xs text-gray-400">Counted in {getUnit(material.unit).plural}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Stock value</p>
          <p className="mt-1 font-semibold text-gray-900">{formatCurrency(Math.round(stock.value))}</p>
          <p className="mt-2 truncate text-xs text-gray-400">Kept in {material.defaultLocation}</p>
        </div>
      </div>

      {/* Open batches */}
      <SectionHeading
        title="Batches in issue order"
        aside="First in, first out"
        className="mt-8"
      />
      {stock.openBatches.length ? (
        <ol className="mt-4">
          {stock.openBatches.map((batch, i) => (
            <BatchCard key={batch.id} batch={batch} position={i} unitId={material.unit} />
          ))}
        </ol>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
          No stock in the store. Record a delivery to add a batch.
        </p>
      )}

      {usedBatches.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowUsed((prev) => !prev)}
            aria-expanded={showUsed}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Icon
              name="chevronDown"
              className={`h-4 w-4 transition-transform ${showUsed ? 'rotate-180' : ''}`}
            />
            {showUsed ? 'Hide' : 'Show'} {usedBatches.length} used-up{' '}
            {usedBatches.length === 1 ? 'batch' : 'batches'}
          </button>
          {showUsed && (
            <ul className="mt-3 space-y-2">
              {usedBatches.map((batch) => (
                <li
                  key={batch.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3.5 py-2.5 text-sm"
                >
                  <span className="min-w-0 truncate text-gray-600">
                    Received {formatDate(batch.receivedOn)} · GRN {batch.grnNo}
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatQuantity(batch.quantityReceived, material.unit)} · used up
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* History */}
      <SectionHeading title="History" aside={`${history.length} movements`} className="mt-8" />
      {history.length ? (
        <ul className="mt-4 space-y-1">
          {history.map((entry) => (
            <li key={entry.key} className="flex gap-3 rounded-lg px-1 py-2">
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  entry.kind === 'in' ? 'bg-blue-50 text-blue-600' : 'bg-amber-100 text-amber-700'
                }`}
              >
                <Icon
                  name={entry.kind === 'in' ? 'arrowDownToLine' : 'arrowUpFromLine'}
                  className="h-3.5 w-3.5"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-medium text-gray-900">{entry.title}</p>
                  <p
                    className={`shrink-0 text-sm font-semibold ${
                      entry.kind === 'in' ? 'text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    {entry.kind === 'in' ? '+' : '−'}
                    {formatQuantity(entry.quantity, material.unit)}
                  </p>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs text-gray-500">{entry.detail}</p>
                  <p className="shrink-0 text-xs text-gray-400">{formatDayMonth(entry.date)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-gray-500">No deliveries or issues yet.</p>
      )}
    </SlideOver>
  );
}

export default MaterialPanel;
