import Icon from '../../../common/Icon/Icon';
import type { IconName } from '../../../common/Icon/Icon';

/**
 * SiteSnapshot
 *
 * Four headline tiles for the site — labor, materials, machines, programme.
 * Values are sample data until the dashboard is wired to the backend.
 */
type Stat = {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  /** Optional 0–100 progress bar under the value. */
  progress?: number;
};

const stats: Stat[] = [
  { label: 'Workers on site', value: '128', note: '+6 since yesterday', icon: 'users' },
  { label: 'Open material requests', value: '14', note: '3 awaiting approval', icon: 'package' },
  { label: 'Machines in use', value: '9 / 12', note: '2 idle for over an hour', icon: 'cog' },
  { label: 'Programme progress', value: '42%', note: 'Week 18 of 44', icon: 'chartGantt', progress: 42 },
];

function SiteSnapshot() {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-3">
        <h2 className="font-mono text-xs tracking-widest text-blue-600">
          · SITE SNAPSHOT
        </h2>
        <span
          className="h-px flex-1 border-t border-dashed border-gray-300"
          aria-hidden="true"
        />
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-mono text-[10px] tracking-widest text-amber-700">
          SAMPLE DATA
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon name={stat.icon} className="h-[18px] w-[18px]" />
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              {stat.value}
            </p>
            {stat.progress !== undefined && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            )}
            <p className="mt-2 font-mono text-[11px] tracking-wide text-gray-400">
              {stat.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SiteSnapshot;
