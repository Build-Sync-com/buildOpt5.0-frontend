/**
 * DateTile
 *
 * Tear-off-calendar style date for delivery and issue notes.
 */
type DateTileProps = {
  /** ISO date (yyyy-mm-dd). */
  date: string;
  tone?: 'blue' | 'amber';
};

function DateTile({ date, tone = 'blue' }: DateTileProps) {
  const [y, m, d] = date.split('-').map(Number);
  const month = new Date(y, m - 1, d).toLocaleDateString('en-GB', { month: 'short' });

  return (
    <div
      className="flex w-12 shrink-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-center"
      aria-hidden="true"
    >
      <span
        className={`py-0.5 text-[11px] font-semibold ${
          tone === 'blue' ? 'bg-blue-600 text-white' : 'bg-amber-400 text-gray-900'
        }`}
      >
        {month}
      </span>
      <span className="py-1 text-lg leading-none font-bold text-gray-900">{d}</span>
    </div>
  );
}

export default DateTile;
