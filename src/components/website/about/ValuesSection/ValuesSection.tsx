/**
 * ValuesSection
 *
 * The principles BuildOpt is built on, presented as numbered "drawing sheet"
 * cards (VAL-01 … VAL-04) echoing the core-modules layout on the home page.
 */
type Value = {
  code: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const iconClass = 'h-6 w-6';

const values: Value[] = [
  {
    code: 'VAL-01',
    title: 'Built for the field',
    description:
      'Designed alongside site engineers and foremen — not just for head office. If it does not work in mud and a hard hat, it does not ship.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M2 18h20" />
        <path d="M4 18V9a8 8 0 0 1 16 0v9" />
        <path d="M12 1v2" />
        <path d="M12 9v9" />
      </svg>
    ),
  },
  {
    code: 'VAL-02',
    title: 'One source of truth',
    description:
      'Every module talks to the others. No duplicate entry, no conflicting versions — one number everyone on the project can trust.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="m4.93 4.93 2.83 2.83" />
        <path d="m16.24 16.24 2.83 2.83" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
      </svg>
    ),
  },
  {
    code: 'VAL-03',
    title: 'Decisions from data',
    description:
      'Idle hours, wastage and delays become visible the moment they happen — so calls are made on live signals, not gut feel after the fact.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    code: 'VAL-04',
    title: 'Safety is structural',
    description:
      'Certifications, compliance checks and safe assignments are baked into the workflow — never an afterthought bolted on at inspection time.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

function ValuesSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-blue-600">
            · WHAT WE STAND ON
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            The principles we pour the foundations on
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Four convictions shape every decision we make about the product —
            from the smallest field interaction to how the whole platform fits
            together.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {values.map((value, index) => (
            <article
              key={value.code}
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
                    {value.icon}
                  </span>
                  <span className="font-mono text-xs tracking-widest text-gray-400">
                    {value.code}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  {value.title}
                </h3>
                <p className="mt-2 text-gray-600">{value.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ValuesSection;
