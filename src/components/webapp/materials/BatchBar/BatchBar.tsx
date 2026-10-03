import { formatDayMonth, formatQuantity } from '../../../../utils/materials';
import type { Batch, UnitId } from '../../../../types/materials';

/**
 * BatchBar
 *
 * Stock on hand split into its batches, oldest on the left. With more than
 * one batch, the amber segment is the batch the next issue will draw from.
 */
type BatchBarProps = {
  /** Open batches in FIFO order. */
  batches: Batch[];
  unit: UnitId;
  className?: string;
};

function BatchBar({ batches, unit, className = '' }: BatchBarProps) {
  const total = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);

  if (total <= 0) {
    return (
      <div
        className={`h-2.5 rounded-full border border-dashed border-gray-300 ${className}`}
        aria-label="No stock"
      />
    );
  }

  return (
    <div
      className={`flex h-2.5 gap-0.5 overflow-hidden rounded-full ${className}`}
      role="img"
      aria-label={`${batches.length} ${batches.length === 1 ? 'batch' : 'batches'}, oldest first`}
    >
      {batches.map((batch, i) => (
        <span
          key={batch.id}
          title={`Received ${formatDayMonth(batch.receivedOn)} · ${formatQuantity(batch.quantityRemaining, unit)} left`}
          className={`h-full min-w-1.5 ${
            i === 0 && batches.length > 1
              ? 'bg-amber-400'
              : i % 2 === 1 || batches.length === 1
                ? 'bg-blue-600'
                : 'bg-blue-400'
          }`}
          style={{ width: `${(batch.quantityRemaining / total) * 100}%` }}
        />
      ))}
    </div>
  );
}

export default BatchBar;
