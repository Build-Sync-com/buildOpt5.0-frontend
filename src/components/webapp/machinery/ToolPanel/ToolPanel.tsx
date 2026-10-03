import { useMemo } from 'react';
import Icon from '../../../common/Icon/Icon';
import type { IconName } from '../../../common/Icon/Icon';
import SlideOver from '../../../common/SlideOver/SlideOver';
import SectionHeading from '../../materials/SectionHeading/SectionHeading';
import { accentButtonClass, primaryButtonClass, secondaryButtonClass } from '../../materials/formStyles';
import AvailabilityBar from '../AvailabilityBar/AvailabilityBar';
import { ToolStatusBadge } from '../ToolList/ToolList';
import { getToolCategory } from '../../../../constants/machinery';
import { checkoutOverdue, formatPieces } from '../../../../utils/machinery';
import { formatCurrency, formatDate, formatDayMonth } from '../../../../utils/materials';
import type { MachineryState, ToolStock } from '../../../../types/machinery';

/**
 * ToolPanel
 *
 * One tool in detail: how many are where, who has them out right now, which
 * owner's lots they belong to, and every movement in and out.
 */
type ToolPanelProps = {
  stock: ToolStock | null;
  state: MachineryState;
  canManage: boolean;
  onClose: () => void;
  onReceive: (toolId: string) => void;
  onCheckout: (toolId: string) => void;
  onSendBack: (toolId: string) => void;
};

type HistoryEntry = {
  key: string;
  date: string;
  icon: IconName;
  tone: 'blue' | 'amber' | 'gray';
  title: string;
  detail: string;
  quantity: string;
};

const toneClass = {
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-100 text-amber-700',
  gray: 'bg-gray-100 text-gray-500',
};

function ToolPanel({ stock, state, canManage, onClose, onReceive, onCheckout, onSendBack }: ToolPanelProps) {
  const toolId = stock?.tool.id;

  const history = useMemo<HistoryEntry[]>(() => {
    if (!toolId) return [];
    const entries: HistoryEntry[] = [];

    state.lots
      .filter((lot) => lot.toolId === toolId)
      .forEach((lot) =>
        entries.push({
          key: `in-${lot.id}`,
          date: lot.receivedOn,
          icon: 'arrowDownToLine',
          tone: 'blue',
          title: `Received from ${lot.owner}`,
          detail: [`ERN ${lot.ernNo}`, lot.dailyRate ? `${formatCurrency(lot.dailyRate)} / piece / day` : '']
            .filter(Boolean)
            .join(' · '),
          quantity: `+${lot.quantity}`,
        }),
      );

    state.returns.forEach((ret) =>
      ret.tools
        .filter((line) => line.toolId === toolId)
        .forEach((line) =>
          entries.push({
            key: `rtn-${ret.id}-${line.lotId}`,
            date: ret.returnedOn,
            icon: 'undo',
            tone: 'gray',
            title: `Sent back to ${ret.owner}`,
            detail: [`RTN ${ret.rtnNo}`, line.damaged ? `${line.damaged} damaged` : ''].filter(Boolean).join(' · '),
            quantity: `−${line.quantity}`,
          }),
        ),
    );

    state.checkouts.forEach((checkout) => {
      const line = checkout.lines.find((l) => l.toolId === toolId);
      if (!line) return;
      entries.push({
        key: `out-${checkout.id}`,
        date: checkout.checkedOutOn,
        icon: 'arrowUpFromLine',
        tone: 'amber',
        title: `Lent to ${checkout.issuedTo}`,
        detail: `Slip ${checkout.slipNo} · ${checkout.workArea}`,
        quantity: String(line.quantity),
      });
      const back = checkout.checkIn?.lines.find((l) => l.toolId === toolId);
      if (checkout.checkIn && back) {
        entries.push({
          key: `back-${checkout.id}`,
          date: checkout.checkIn.returnedOn,
          icon: 'arrowDownToLine',
          tone: back.missing || back.damaged ? 'amber' : 'gray',
          title: `Checked in from ${checkout.issuedTo}`,
          detail: [
            `Slip ${checkout.slipNo}`,
            back.damaged ? `${back.damaged} damaged` : '',
            back.missing ? `${back.missing} missing` : '',
          ]
            .filter(Boolean)
            .join(' · '),
          quantity: String(line.quantity - back.missing),
        });
      }
    });

    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, [state, toolId]);

  if (!stock) return null;
  const { tool } = stock;
  const category = getToolCategory(tool.category);

  const tiles = [
    { label: 'In store', value: stock.available, className: 'text-blue-700' },
    { label: 'Out', value: stock.out, className: 'text-amber-700' },
    { label: 'Damaged', value: stock.damaged, className: stock.damaged ? 'text-red-600' : 'text-gray-900' },
    { label: 'Lost', value: stock.lost, className: stock.lost ? 'text-red-600' : 'text-gray-900' },
  ];

  return (
    <SlideOver
      open
      onClose={onClose}
      eyebrow={category.label}
      title={tool.name}
      description={tool.spec}
      footer={
        canManage && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {stock.lots.length > 0 && (
              <button type="button" onClick={() => onSendBack(tool.id)} className={secondaryButtonClass}>
                <Icon name="undo" className="h-4 w-4" />
                Send back
              </button>
            )}
            <button
              type="button"
              onClick={() => onCheckout(tool.id)}
              disabled={stock.available <= 0}
              className={accentButtonClass}
            >
              <Icon name="arrowUpFromLine" className="h-4 w-4" />
              Check out
            </button>
            <button type="button" onClick={() => onReceive(tool.id)} className={primaryButtonClass}>
              <Icon name="arrowDownToLine" className="h-4 w-4" />
              Receive more
            </button>
          </div>
        )
      }
    >
      {/* Summary */}
      <div className="rounded-xl border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">On site</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{formatPieces(stock.onSite)}</p>
          </div>
          <ToolStatusBadge stock={stock} />
        </div>
        <AvailabilityBar stock={stock} className="mt-4" />
        <dl className="mt-4 grid grid-cols-4 gap-3">
          {tiles.map((tile) => (
            <div key={tile.label}>
              <dt className="text-xs text-gray-400">{tile.label}</dt>
              <dd className={`mt-0.5 text-lg font-semibold ${tile.className}`}>{tile.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-gray-400">
          Kept in {tool.location}
          {stock.hireCost > 0 && ` · ${formatCurrency(stock.hireCost)} hire owed so far`}
        </p>
      </div>

      {/* Holders */}
      <SectionHeading title="Out with" aside={`${stock.out} pieces`} className="mt-8" />
      {stock.holders.length ? (
        <ul className="mt-4 space-y-2">
          {stock.holders.map(({ checkout, quantity }) => {
            const overdue = checkoutOverdue(checkout);
            return (
              <li
                key={checkout.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 ${
                  overdue ? 'border-red-200 bg-red-50/40' : 'border-gray-200'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-gray-900">{checkout.issuedTo}</span>
                  <span className="block truncate text-xs text-gray-500">
                    {checkout.workArea} · Slip {checkout.slipNo} · since {formatDayMonth(checkout.checkedOutOn)}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold text-gray-900">{formatPieces(quantity)}</span>
                  <span className={`block text-xs ${overdue ? 'font-medium text-red-600' : 'text-gray-400'}`}>
                    {overdue ? 'Overdue' : 'Due'} {formatDayMonth(checkout.dueBack)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-gray-300 px-4 py-5 text-center text-sm text-gray-500">
          Nobody has this tool out right now.
        </p>
      )}

      {/* Lots */}
      <SectionHeading title="Belongs to" aside="Goes back to its owner" className="mt-8" />
      {stock.lots.length ? (
        <ul className="mt-4 space-y-2">
          {stock.lots.map((lot) => (
            <li key={lot.id} className="rounded-xl border border-gray-200 px-3.5 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-medium text-gray-900">{lot.owner}</p>
                <p className="shrink-0 text-sm font-semibold text-gray-900">
                  {lot.remaining} <span className="font-normal text-gray-400">of {lot.quantity}</span>
                </p>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                {lot.ownership === 'hired' ? 'Hired' : 'Company-owned'} · received {formatDate(lot.receivedOn)} · ERN{' '}
                {lot.ernNo}
                {lot.dailyRate ? ` · ${formatCurrency(lot.dailyRate)} / piece / day` : ''}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-gray-500">No pieces on site.</p>
      )}
      {stock.lost > 0 && stock.lots.some((lot) => lot.ownership === 'hired') && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <Icon name="triangleAlert" className="mt-px h-3.5 w-3.5 shrink-0" />
          {stock.lost} lost {stock.lost === 1 ? 'piece' : 'pieces'} can’t go back - settle with the owner.
        </p>
      )}

      {/* History */}
      <SectionHeading title="History" aside={`${history.length} movements`} className="mt-8" />
      {history.length ? (
        <ul className="mt-4 space-y-1">
          {history.map((entry) => (
            <li key={entry.key} className="flex gap-3 rounded-lg px-1 py-2">
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toneClass[entry.tone]}`}
              >
                <Icon name={entry.icon} className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-medium text-gray-900">{entry.title}</p>
                  <p className="shrink-0 text-sm font-semibold text-gray-900">{entry.quantity}</p>
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
        <p className="mt-4 text-sm text-gray-500">No movements yet.</p>
      )}
    </SlideOver>
  );
}

export default ToolPanel;
