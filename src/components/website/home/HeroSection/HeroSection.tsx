import { Link } from 'react-router-dom';

/**
 * HeroSection
 *
 * Light, blueprint-themed home hero. Copy and CTAs on the left; on the right a
 * schematic "one platform" diagram — a central BuildOpt hub wired to the four
 * things every site juggles (labor, materials, equipment, timeline). It
 * introduces what the system *is* rather than faking live data.
 */
const nodes = [
  {
    label: 'Labor',
    pos: 'left-0 top-[6%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    ),
  },
  {
    label: 'Materials',
    pos: 'right-0 top-[6%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    label: 'Equipment',
    pos: 'left-0 bottom-[6%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
  {
    label: 'Timeline',
    pos: 'right-0 bottom-[6%]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M8 6h13" />
        <path d="M8 12h9" />
        <path d="M8 18h5" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
];

const stats = [
  { value: '2.5×', label: 'faster crew allocation' },
  { value: '40%', label: 'fewer idle machine hours' },
  { value: '18%', label: 'less material waste' },
  { value: '1', label: 'platform for the whole site' },
];

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-blueprint-grid">
      {/* Soft radial glow so the grid fades out toward the edges */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.10),transparent_55%),radial-gradient(ellipse_at_bottom,white_30%,transparent_75%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-14 sm:px-6 lg:px-8 lg:pt-24 lg:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-mono text-xs tracking-widest text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              BUILDOPT · SITE OS v5.0
            </p>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              One platform to run your{' '}
              <span className="relative whitespace-nowrap">
                <span className="absolute -inset-x-1 inset-y-1 -skew-y-1 rounded bg-amber-200/70" />
                <span className="relative">entire site</span>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
              BuildOpt brings labor, materials, equipment and timelines together
              in one intelligent command center — so every part of your
              construction project stays in sync, from groundbreak to handover.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/contact"
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-blue-700/25"
              >
                Start managing your site
              </Link>
              <Link
                to="/features"
                className="group rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                Explore features
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>

            <p className="mt-8 font-mono text-xs tracking-wide text-gray-400">
              DWG-001 · LABOR / MATERIALS / EQUIPMENT / TIMELINE
            </p>
          </div>

          {/* Schematic: one hub, four connected disciplines */}
          <div className="relative">
            <div
              className="absolute -top-6 left-8 right-8 hidden h-3 border-x border-t border-dashed border-blue-300 lg:block"
              aria-hidden="true"
            />

            <div className="relative rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-sm sm:p-8">
              <div className="relative mx-auto aspect-square w-full max-w-sm">
                {/* Connector lines (behind the cards) */}
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full"
                  aria-hidden="true"
                >
                  {[
                    [20, 24],
                    [80, 24],
                    [20, 76],
                    [80, 76],
                  ].map(([x, y]) => (
                    <line
                      key={`${x}-${y}`}
                      x1="50"
                      y1="50"
                      x2={x}
                      y2={y}
                      stroke="rgb(37 99 235 / 0.35)"
                      strokeWidth="0.6"
                      strokeDasharray="2 2"
                    />
                  ))}
                </svg>

                {/* Corner nodes */}
                {nodes.map((node) => (
                  <div
                    key={node.label}
                    className={`absolute ${node.pos} flex w-20 flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-center shadow-sm sm:w-24`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      {node.icon}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-700">
                      {node.label}
                    </span>
                  </div>
                ))}

                {/* Central hub */}
                <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/30 ring-8 ring-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
                    <path d="M3 21h18" />
                    <path d="M5 21V7l8-4v18" />
                    <path d="M19 21V11l-6-4" />
                    <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
                  </svg>
                  <span className="mt-1 text-[11px] font-bold tracking-tight">
                    BuildOpt
                  </span>
                </div>
              </div>

              <p className="mt-6 text-center font-mono text-xs tracking-widest text-gray-400">
                FIG. 01 — ONE PLATFORM, EVERY PART OF THE SITE
              </p>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <dl className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 shadow-sm lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white px-6 py-5">
              <dt className="order-last mt-1 text-sm text-gray-500">
                {stat.label}
              </dt>
              <dd className="text-3xl font-bold tracking-tight text-blue-600">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default HeroSection;
