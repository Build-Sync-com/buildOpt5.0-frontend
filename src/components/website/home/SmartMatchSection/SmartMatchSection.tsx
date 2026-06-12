/**
 * SmartMatchSection
 *
 * Spotlight on the auto labor-matching engine. The left side is a name-free UI
 * mock built in CSS: a task with its requirements feeding a ranked, anonymized
 * shortlist of best-fit crew. The right side explains what the engine weighs.
 */
type Match = {
  role: string;
  meta: string;
  score: number;
  tag?: string;
  barClass: string;
};

const matches: Match[] = [
  {
    role: 'Mason · NVQ-4',
    meta: 'On site · 4.9 ★ avg',
    score: 96,
    tag: 'Best fit',
    barClass: 'bg-emerald-500',
  },
  {
    role: 'Mason · NVQ-4',
    meta: '0.4 km away · 4.7 ★ avg',
    score: 91,
    barClass: 'bg-blue-500',
  },
  {
    role: 'Mason · NVQ-3',
    meta: 'Free from Monday · 4.8 ★ avg',
    score: 84,
    barClass: 'bg-blue-400',
  },
];

const matchSignals = [
  {
    title: 'Skills & certifications',
    description: 'Only workers qualified for the task make the shortlist.',
  },
  {
    title: 'Availability & location',
    description: 'Cross-checked against shifts, leave and distance to site.',
  },
  {
    title: 'Past performance',
    description: 'Ratings from previous tasks weight every recommendation.',
  },
];

// Neutral, anonymous worker glyph — no individuals are named.
const WorkerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

function SmartMatchSection() {
  return (
    <section className="overflow-hidden bg-gray-50 py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* UI mock */}
        <div className="relative order-last lg:order-first">
          <div
            className="absolute -inset-6 rounded-3xl bg-blueprint-grid opacity-60"
            aria-hidden="true"
          />
          <div className="relative rounded-2xl border border-gray-200 bg-white shadow-xl shadow-blue-900/5">
            {/* Task header */}
            <div className="border-b border-gray-100 px-5 py-4">
              <p className="font-mono text-[10px] tracking-widest text-gray-400">
                AUTO-MATCH · TASK #T-1284
              </p>
              <h3 className="mt-1 font-semibold text-gray-900">
                Block masonry — Level 3, Tower A
              </h3>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {['Masonry NVQ-4', '3 workers', 'Starts Monday'].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Ranked, anonymized shortlist */}
            <ul className="divide-y divide-gray-100">
              {matches.map((match, index) => (
                <li key={index} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="font-mono text-xs text-gray-300">
                    {index + 1}
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <WorkerIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      {match.role}
                      {match.tag && (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                          {match.tag}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-gray-500">{match.meta}</p>
                  </div>
                  <div className="w-20">
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div
                        className={`h-1.5 rounded-full ${match.barClass}`}
                        style={{ width: `${match.score}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-9 text-right text-sm font-bold text-gray-700">
                    {match.score}%
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-100 px-5 py-3.5">
              <span className="inline-flex w-full cursor-default items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                Assign best-fit crew
              </span>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div>
          <p className="font-mono text-xs tracking-widest text-blue-600">
            SHEET 03 · INTELLIGENCE
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            The right crew for every task, found in seconds
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Describe the task — BuildOpt ranks your entire workforce against it.
            No more ringing around supervisors to find out who is free,
            qualified and nearby.
          </p>

          <dl className="mt-8 space-y-6">
            {matchSignals.map((signal, index) => (
              <div key={signal.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 font-mono text-xs font-bold text-amber-700">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <dt className="font-semibold text-gray-900">{signal.title}</dt>
                  <dd className="mt-0.5 text-gray-600">{signal.description}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export default SmartMatchSection;
