import { useMemo, useState } from 'react';
import Icon from '../../../common/Icon/Icon';
import DateTile from '../DateTile/DateTile';
import { inputClass } from '../formStyles';
import { formatAgo, formatDayMonth, formatQuantity } from '../../../../utils/materials';
import type { MaterialStoreState } from '../../../../types/materials';

/**
 * IssueLog
 *
 * Every material issue note, newest first: where the stock went, who took
 * it, and which batches it came out of.
 */
type IssueLogProps = {
  state: MaterialStoreState;
  onOpenMaterial: (materialId: string) => void;
};

function IssueLog({ state, onOpenMaterial }: IssueLogProps) {
  const [query, setQuery] = useState('');
  const materialById = useMemo(
    () => new Map(state.materials.map((m) => [m.id, m])),
    [state.materials],
  );
  const batchById = useMemo(() => new Map(state.batches.map((b) => [b.id, b])), [state.batches]);

  const issues = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...state.issues]
      .sort((a, b) => b.issuedOn.localeCompare(a.issuedOn) || b.issueNo - a.issueNo)
      .filter((issue) => {
        if (!q) return true;
        const haystack = [
          `min ${issue.issueNo}`,
          issue.workArea,
          issue.issuedTo,
          issue.purpose,
          issue.requestRef,
          ...issue.lines.map((l) => materialById.get(l.materialId)?.name),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
  }, [state.issues, query, materialById]);

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
          placeholder="Search issue no., work area or person"
          aria-label="Search issues"
          className={`${inputClass} pl-9`}
        />
      </div>

      {issues.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 px-5 py-14 text-center">
          <p className="font-medium text-gray-900">No issues found</p>
          <p className="mt-1 text-sm text-gray-500">Try a different search.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {issues.map((issue) => {
            const meta = [
              `Collected by ${issue.issuedTo}`,
              issue.purpose,
              issue.requestRef,
              `Issued by ${issue.issuedBy}`,
            ].filter(Boolean);

            return (
              <li key={issue.id} className="rounded-2xl border border-gray-200 bg-white">
                <div className="flex gap-4 p-4 sm:p-5">
                  <DateTile date={issue.issuedOn} tone="amber" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">
                      <span className="text-amber-700">MIN {issue.issueNo}</span>
                      <span className="text-gray-300"> · </span>
                      {issue.workArea}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {meta.join(' · ')}
                      <span className="text-gray-400"> · {formatAgo(issue.issuedOn)}</span>
                    </p>
                  </div>
                </div>

                <ul className="divide-y divide-gray-100 border-t border-dashed border-gray-200">
                  {issue.lines.map((line) => {
                    const material = materialById.get(line.materialId);
                    if (!material) return null;
                    return (
                      <li key={line.materialId}>
                        <button
                          type="button"
                          onClick={() => onOpenMaterial(material.id)}
                          className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3 text-left transition-colors hover:bg-amber-50/40 sm:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1.2fr)] sm:px-5"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-gray-900">
                              {material.name}
                            </span>
                            <span className="block truncate text-xs text-gray-500">{material.spec}</span>
                          </span>
                          <span className="text-right text-sm font-semibold text-gray-900 sm:text-left">
                            −{formatQuantity(line.quantity, material.unit)}
                          </span>
                          <span className="col-span-2 flex flex-wrap gap-1.5 sm:col-span-1 sm:justify-end">
                            {line.draws.map((draw) => {
                              const batch = batchById.get(draw.batchId);
                              if (!batch) return null;
                              return (
                                <span
                                  key={draw.batchId}
                                  title={`GRN ${batch.grnNo} · ${batch.supplier}`}
                                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                                >
                                  {formatDayMonth(batch.receivedOn)} batch
                                  <span className="font-semibold text-gray-900">
                                    {formatQuantity(draw.quantity, material.unit)}
                                  </span>
                                </span>
                              );
                            })}
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

export default IssueLog;
