import { useMemo, useState } from 'react';
import Icon from '../../../common/Icon/Icon';
import DateTile from '../../materials/DateTile/DateTile';
import { secondaryButtonClass } from '../../materials/formStyles';
import { checkoutOverdue } from '../../../../utils/machinery';
import { daysBetween, formatAgo, formatDate, formatDayMonth, todayISO } from '../../../../utils/materials';
import type { Tool, ToolCheckout } from '../../../../types/machinery';

/**
 * CheckoutList
 *
 * Tool slips still open - who has which tools and since when - overdue ones
 * first. Slips already checked in are listed underneath with what came back
 * damaged or didn't come back at all.
 */
type CheckoutListProps = {
  checkouts: ToolCheckout[];
  tools: Tool[];
  canManage: boolean;
  onCheckIn: (checkoutId: string) => void;
  onOpenTool: (toolId: string) => void;
};

function DueLabel({ checkout }: { checkout: ToolCheckout }) {
  const today = todayISO();
  if (checkoutOverdue(checkout, today)) {
    const late = daysBetween(checkout.dueBack, today);
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-red-700">
        <Icon name="triangleAlert" className="h-3.5 w-3.5" />
        {late} {late === 1 ? 'day' : 'days'} overdue
      </span>
    );
  }
  if (checkout.dueBack === today) {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-orange-700">
        Due back today
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-gray-600">
      Due back {formatDayMonth(checkout.dueBack)}
    </span>
  );
}

function CheckoutList({ checkouts, tools, canManage, onCheckIn, onOpenTool }: CheckoutListProps) {
  const [showClosed, setShowClosed] = useState(false);
  const toolById = useMemo(() => new Map(tools.map((t) => [t.id, t])), [tools]);

  const open = useMemo(
    () =>
      checkouts
        .filter((c) => !c.checkIn)
        .sort((a, b) => a.dueBack.localeCompare(b.dueBack) || a.slipNo - b.slipNo),
    [checkouts],
  );
  const closed = useMemo(
    () =>
      checkouts
        .filter((c) => c.checkIn)
        .sort(
          (a, b) =>
            (b.checkIn?.returnedOn ?? '').localeCompare(a.checkIn?.returnedOn ?? '') || b.slipNo - a.slipNo,
        ),
    [checkouts],
  );

  return (
    <div>
      {open.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-5 py-14 text-center">
          <p className="font-medium text-gray-900">Every tool is back in the store</p>
          <p className="mt-1 text-sm text-gray-500">Tools lent to workers show here until they’re checked in.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {open.map((checkout) => {
            const overdue = checkoutOverdue(checkout);
            const pieces = checkout.lines.reduce((sum, l) => sum + l.quantity, 0);
            return (
              <li
                key={checkout.id}
                className={`rounded-2xl border bg-white ${overdue ? 'border-red-200' : 'border-gray-200'}`}
              >
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:p-5">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <DateTile date={checkout.checkedOutOn} tone="amber" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="font-semibold text-gray-900">
                          <span className="text-amber-700">Slip {checkout.slipNo}</span>
                          <span className="text-gray-300"> · </span>
                          {checkout.issuedTo}
                        </p>
                        <DueLabel checkout={checkout} />
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {checkout.workArea} · {pieces} {pieces === 1 ? 'piece' : 'pieces'} · Issued by{' '}
                        {checkout.issuedBy}
                        <span className="text-gray-400"> · {formatAgo(checkout.checkedOutOn)}</span>
                      </p>
                    </div>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => onCheckIn(checkout.id)}
                      className={`${secondaryButtonClass} shrink-0 py-2`}
                    >
                      <Icon name="arrowDownToLine" className="h-4 w-4" />
                      Check in
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 border-t border-dashed border-gray-200 px-4 py-3 sm:px-5">
                  {checkout.lines.map((line) => {
                    const tool = toolById.get(line.toolId);
                    if (!tool) return null;
                    return (
                      <button
                        key={line.toolId}
                        type="button"
                        onClick={() => onOpenTool(tool.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 transition-colors hover:border-amber-400 hover:bg-amber-50/50"
                      >
                        <span className="font-semibold text-gray-900">{line.quantity} ×</span>
                        {tool.name}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {closed.length > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowClosed((prev) => !prev)}
            aria-expanded={showClosed}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Icon name="chevronDown" className={`h-4 w-4 transition-transform ${showClosed ? 'rotate-180' : ''}`} />
            {showClosed ? 'Hide' : 'Show'} {closed.length} checked-in {closed.length === 1 ? 'slip' : 'slips'}
          </button>
          {showClosed && (
            <ul className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {closed.map((checkout) => {
                const checkIn = checkout.checkIn;
                if (!checkIn) return null;
                const missing = checkIn.lines.reduce((sum, l) => sum + l.missing, 0);
                const damaged = checkIn.lines.reduce((sum, l) => sum + l.damaged, 0);
                return (
                  <li
                    key={checkout.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center sm:px-5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-700">
                        Slip {checkout.slipNo} · {checkout.issuedTo}
                      </span>
                      <span className="block truncate text-xs text-gray-400">
                        {checkout.lines
                          .map((l) => `${l.quantity} × ${toolById.get(l.toolId)?.name ?? 'Tool'}`)
                          .join(', ')}
                      </span>
                    </span>
                    <span className="text-right text-xs sm:text-left">
                      {missing || damaged ? (
                        <span className="font-medium text-amber-700">
                          {[missing && `${missing} missing`, damaged && `${damaged} damaged`]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      ) : (
                        <span className="text-gray-500">All back in good order</span>
                      )}
                      {checkIn.note && <span className="block truncate text-gray-400">{checkIn.note}</span>}
                    </span>
                    <span className="col-span-2 text-xs text-gray-400 sm:col-span-1 sm:text-right">
                      Out {formatDayMonth(checkout.checkedOutOn)} · back {formatDate(checkIn.returnedOn)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default CheckoutList;
