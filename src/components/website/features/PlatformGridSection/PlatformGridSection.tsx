/**
 * PlatformGridSection
 *
 * The capabilities that aren't tied to one module but run across the whole
 * platform — security, reporting, mobile, etc. — as numbered "drawing sheet"
 * cards (SYS-01 … SYS-06), echoing the home/about card grids.
 */
type Capability = {
  code: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const iconClass = 'h-6 w-6';

const capabilities: Capability[] = [
  {
    code: 'SYS-01',
    title: 'Dashboards & analytics',
    description:
      'Live cost, progress and productivity for every site, rolled up to one portfolio view for the head office.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M3 3v18h18" />
        <rect x="7" y="11" width="3" height="6" />
        <rect x="13" y="7" width="3" height="10" />
      </svg>
    ),
  },
  {
    code: 'SYS-02',
    title: 'Real-time alerts',
    description:
      'Low stock, idle machines, expiring certs and schedule slips reach the right person the moment they happen.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M10.268 21a2 2 0 0 0 3.464 0" />
        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
      </svg>
    ),
  },
  {
    code: 'SYS-03',
    title: 'Roles & permissions',
    description:
      'Foremen, QS, store keepers and directors each see exactly what they need — and nothing they should not.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
      </svg>
    ),
  },
  {
    code: 'SYS-04',
    title: 'Mobile field app',
    description:
      'Log attendance, stock and progress from the site — works on a phone, syncs the moment a signal returns.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    code: 'SYS-05',
    title: 'Reports & exports',
    description:
      'Daily site reports, cost statements and BOQ reconciliations generated in a click — export to PDF or Excel.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    ),
  },
  {
    code: 'SYS-06',
    title: 'Audit trail',
    description:
      'Every change is stamped with who, what and when — so disputes are settled with a record, not an argument.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M12 8v4l3 2" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
];

function PlatformGridSection() {
  return (
    <section className="bg-gray-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-blue-600">
            · ACROSS THE PLATFORM
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            The plumbing that ties it all together
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            These run underneath every module — the reporting, security and
            field access that make BuildOpt safe to run a real project on.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap) => (
            <article
              key={cap.code}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  {cap.icon}
                </span>
                <span className="font-mono text-xs tracking-widest text-gray-400">
                  {cap.code}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">
                {cap.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {cap.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PlatformGridSection;
