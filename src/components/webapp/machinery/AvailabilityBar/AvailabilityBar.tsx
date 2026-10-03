import { availabilitySegments } from '../../../../constants/machinery';
import type { ToolStock } from '../../../../types/machinery';

/**
 * AvailabilityBar
 *
 * A tool's pieces on site split into what's in the store, what's out with
 * workers and what's damaged. Lost pieces have left the count already.
 */
type AvailabilityBarProps = {
  stock: Pick<ToolStock, 'onSite' | 'available' | 'out' | 'damaged'>;
  className?: string;
};

function AvailabilityBar({ stock, className = '' }: AvailabilityBarProps) {
  if (stock.onSite <= 0) {
    return (
      <div
        className={`h-2.5 rounded-full border border-dashed border-gray-300 ${className}`}
        aria-label="None on site"
      />
    );
  }

  return (
    <div
      className={`flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-gray-100 ${className}`}
      role="img"
      aria-label={`${stock.available} in store, ${stock.out} out, ${stock.damaged} damaged`}
    >
      {availabilitySegments.map((segment) =>
        stock[segment.key] > 0 ? (
          <span
            key={segment.key}
            title={`${stock[segment.key]} ${segment.label.toLowerCase()}`}
            className={`h-full min-w-1.5 ${segment.className}`}
            style={{ width: `${(stock[segment.key] / stock.onSite) * 100}%` }}
          />
        ) : null,
      )}
    </div>
  );
}

export default AvailabilityBar;
