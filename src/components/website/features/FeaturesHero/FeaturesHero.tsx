import { Link } from 'react-router-dom';

/**
 * FeaturesHero
 *
 * Intro band for the Features page. Copy and CTAs on the left; on the right a
 * drawing "legend" panel — the key that decodes the symbols on an engineering
 * sheet — used here to index the four capability families the page covers.
 */
const legend = [
  { tag: 'FEAT-01', label: 'Labor & crews', count: '12 tools' },
  { tag: 'FEAT-02', label: 'Materials & stock', count: '10 tools' },
  { tag: 'FEAT-03', label: 'Equipment & machines', count: '9 tools' },
  { tag: 'FEAT-04', label: 'Process & timeline', count: '11 tools' },
];

function FeaturesHero() {
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
              SHEET 03 · FEATURES
            </p>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Every tool your site needs,{' '}
              <span className="relative whitespace-nowrap">
                <span className="absolute -inset-x-1 inset-y-1 -skew-y-1 rounded bg-amber-200/70" />
                <span className="relative">under one roof</span>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
              BuildOpt isn't four apps bolted together — it's one platform where
              labor, materials, equipment and the schedule share the same data.
              Here is what you get in each, and how it all connects.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/contact"
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-blue-700/25"
              >
                Book a walkthrough
              </Link>
              <Link
                to="/about"
                className="group rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                Why BuildOpt
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>

            <p className="mt-8 font-mono text-xs tracking-wide text-gray-400">
              · 42 FEATURES · 4 MODULES · 1 SOURCE OF TRUTH
            </p>
          </div>

          {/* Drawing legend panel */}
          <div className="relative">
            <div
              className="absolute -top-6 left-8 right-8 hidden h-3 border-x border-t border-dashed border-blue-300 lg:block"
              aria-hidden="true"
            />

            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 shadow-2xl shadow-blue-900/10 backdrop-blur-sm">
              <div className="hazard-stripe h-1.5" aria-hidden="true" />
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <span className="font-mono text-xs tracking-widest text-gray-400">
                  LEGEND · WHAT'S INSIDE
                </span>
                <span className="font-mono text-xs tracking-widest text-blue-600">
                  FIG. 04
                </span>
              </div>

              <ul className="divide-y divide-gray-100">
                {legend.map((row) => (
                  <li
                    key={row.tag}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <span className="font-mono text-xs tracking-widest text-amber-600">
                      {row.tag}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-gray-900">
                      {row.label}
                    </span>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs text-blue-600">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesHero;
