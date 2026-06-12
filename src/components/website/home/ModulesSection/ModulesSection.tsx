import { Link } from 'react-router-dom';

/**
 * ModulesSection
 *
 * The four core BuildOpt modules presented as numbered "drawing sheet" cards
 * (MOD-01 … MOD-04) with a large faint index in the corner of each card.
 */
type Module = {
  code: string;
  title: string;
  description: string;
  points: string[];
  icon: React.ReactNode;
};

const iconClass = 'h-6 w-6';

const modules: Module[] = [
  {
    code: 'MOD-01',
    title: 'Labor management',
    description:
      'Every worker, skill and certification in one roster — with attendance, payroll and performance tracked per task.',
    points: ['Skill & certification registry', 'Attendance and shift planning', 'Auto-matching crews to tasks'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    code: 'MOD-02',
    title: 'Material management',
    description:
      'Track stock from purchase order to pour. Low-stock alerts, wastage analysis and supplier history keep budgets honest.',
    points: ['Live inventory across stores', 'Procurement & supplier tracking', 'Wastage and cost analytics'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    code: 'MOD-03',
    title: 'Equipment & machines',
    description:
      'Know where every crane, mixer and excavator is, who is operating it, and when it idles — before it costs you.',
    points: ['Utilization & idle-time alerts', 'Maintenance scheduling', 'Operator assignment & logs'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
        <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="M12 2v2" />
        <path d="M12 22v-2" />
        <path d="m17 20.66-1-1.73" />
        <path d="M11 10.27 7 3.34" />
        <path d="m20.66 17-1.73-1" />
        <path d="m3.34 7 1.73 1" />
        <path d="M14 12h8" />
        <path d="M2 12h2" />
      </svg>
    ),
  },
  {
    code: 'MOD-04',
    title: 'Process & timeline',
    description:
      'Plan phases on an interactive Gantt, link dependencies, and see delays ripple through the schedule the moment they happen.',
    points: ['Gantt with dependencies', 'Milestone & delay tracking', 'Daily progress reports'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M8 6h13" />
        <path d="M3 6h.01" />
        <path d="M8 12h9" />
        <path d="M3 12h.01" />
        <path d="M8 18h5" />
        <path d="M3 18h.01" />
      </svg>
    ),
  },
];

function ModulesSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-blue-600">
            SHEET 02 · CORE MODULES
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Four modules. One source of truth.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Stop stitching together spreadsheets, chat groups and whiteboards.
            BuildOpt covers the whole site, and every module talks to the
            others.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {modules.map((module, index) => (
            <article
              key={module.code}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5"
            >
              {/* Oversized faint index number */}
              <span
                className="pointer-events-none absolute -top-6 right-2 text-9xl font-bold text-gray-100 transition group-hover:text-blue-50"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    {module.icon}
                  </span>
                  <span className="font-mono text-xs tracking-widest text-gray-400">
                    {module.code}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  {module.title}
                </h3>
                <p className="mt-2 text-gray-600">{module.description}</p>

                <ul className="mt-5 space-y-2">
                  {module.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-2.5 text-sm text-gray-700"
                    >
                      <span className="h-1.5 w-1.5 rotate-45 bg-amber-400" />
                      {point}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/features"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Explore module
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ModulesSection;
