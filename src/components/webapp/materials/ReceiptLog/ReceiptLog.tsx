import { useMemo, useState } from 'react';
import Icon from '../../../common/Icon/Icon';
import DateTile from '../DateTile/DateTile';
import { inputClass } from '../formStyles';
import { formatAgo, formatCurrency, formatQuantity, roundQty } from '../../../../utils/materials';
import type { MaterialStoreState } from '../../../../types/materials';

/**
 * ReceiptLog
 *
 * Every goods received note, newest first, with what each delivery brought
 * in and what was rejected at the gate.
 */
type ReceiptLogProps = {
  state: MaterialStoreState;
  onOpenMaterial: (materialId: string) => void;
};

function ReceiptLog({ state, onOpenMaterial }: ReceiptLogProps) {
  const [query, setQuery] = useState('');
  const materialById = useMemo(
    () => new Map(state.materials.map((m) => [m.id, m])),
    [state.materials],
  );

  const receipts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...state.receipts]
      .sort((a, b) => b.receivedOn.localeCompare(a.receivedOn) || b.grnNo - a.grnNo)
      .filter((r) => {
        if (!q) return true;
        const haystack = [
          `grn ${r.grnNo}`,
          r.supplier,
          r.deliveryNote,
          r.vehicleNo,
          r.purchaseOrder,
          ...r.lines.map((l) => materialById.get(l.materialId)?.name),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
  }, [state.receipts, query, materialById]);

  return (
    <div>
      <div className="relative sm:w-80">
        <Icon
          name="search"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GRN, supplier or material"
          aria-label="Search deliveries"
          className={`${inputClass} pl-9`}
        />
      </div>

      {receipts.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 px-5 py-14 text-center">
          <p className="font-medium text-gray-900">No deliveries found</p>
          <p className="mt-1 text-sm text-gray-500">Try a different search.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {receipts.map((receipt) => {
            const value = receipt.lines.reduce(
              (sum, l) => sum + (l.quantityDelivered - l.quantityRejected) * l.unitCost,
              0,
            );
            const meta = [
              receipt.deliveryNote,
              receipt.vehicleNo,
              receipt.purchaseOrder,
              `Received by ${receipt.receivedBy}`,
            ].filter(Boolean);

            return (
              <li key={receipt.id} className="rounded-2xl border border-gray-200 bg-white">
                <div className="flex gap-4 p-4 sm:p-5">
                  <DateTile date={receipt.receivedOn} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="font-semibold text-gray-900">
                        <span className="text-blue-600">GRN {receipt.grnNo}</span>
                        <span className="text-gray-300"> · </span>
                        {receipt.supplier}
                      </p>
                      {value > 0 && (
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(Math.round(value))}
                        </p>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {meta.join(' · ')}
                      <span className="text-gray-400"> · {formatAgo(receipt.receivedOn)}</span>
                    </p>
                  </div>
                </div>

                <ul className="divide-y divide-gray-100 border-t border-dashed border-gray-200">
                  {receipt.lines.map((line) => {
                    const material = materialById.get(line.materialId);
                    if (!material) return null;
                    const accepted = roundQty(line.quantityDelivered - line.quantityRejected);
                    return (
                      <li key={line.batchId}>
                        <button
                          type="button"
                          onClick={() => onOpenMaterial(material.id)}
                          className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-blue-50/40 sm:grid-cols-[minmax(0,1fr)_9rem_9rem] sm:px-5"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-gray-900">
                              {material.name}
                            </span>
                            <span className="block truncate text-xs text-gray-500">
                              {material.spec}
                              {line.remarks && <span className="text-gray-400"> · {line.remarks}</span>}
                            </span>
                          </span>
                          <span className="text-right sm:text-left">
                            <span className="block text-sm font-semibold text-blue-700">
                              +{formatQuantity(accepted, material.unit)}
                            </span>
                            {line.quantityRejected > 0 && (
                              <span className="block text-xs font-medium text-amber-700">
                                {formatQuantity(line.quantityRejected, material.unit)} rejected
                              </span>
                            )}
                          </span>
                          <span className="col-span-2 text-xs text-gray-500 sm:col-span-1 sm:text-right">
                            {line.unitCost ? `${formatCurrency(line.unitCost)} each` : 'No price'}
                            <span className="block text-gray-400">{line.location}</span>
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

export default ReceiptLog;
