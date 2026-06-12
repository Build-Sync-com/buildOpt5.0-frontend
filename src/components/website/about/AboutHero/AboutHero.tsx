/**
 * AboutHero
 *
 * Intro band for the About page. Copy on the left; on the right a drawing
 * "title block" — the boxed metadata stamp found in the corner of every
 * engineering sheet — used here as a spec card for the company itself.
 */
const titleBlock = [
  { field: 'PROJECT', value: 'BuildOpt — Site OS' },
  { field: 'DISCIPLINE', value: 'Construction operations' },
  { field: 'FOUNDED', value: '2023 · on a jobsite' },
  { field: 'REVISION', value: 'v5.0' },
  { field: 'STATUS', value: 'In service' },
];

function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-blueprint-grid">
      {/* Soft radial glow so the grid fades out toward the edges */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.10),transparent_55%),radial-gradient(ellipse_at_bottom,white_30%,transparent_75%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-14 sm:px-6 lg:px-8 lg:pt-24 lg:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-mono text-xs tracking-widest text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              SHEET 03 · ABOUT BUILDOPT
            </p>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              We're rebuilding how{' '}
              <span className="relative whitespace-nowrap">
                <span className="absolute -inset-x-1 inset-y-1 -skew-y-1 rounded bg-amber-200/70" />
                <span className="relative">sites are run</span>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
              BuildOpt started with a simple frustration: construction is planned
              on drawings, but run on radios, spreadsheets and gut feel. We set
              out to give every site one command center — where labor, materials,
              equipment and the schedule finally live together.
            </p>

            <p className="mt-8 font-mono text-xs tracking-wide text-gray-400">
              · BUILT WITH SITE ENGINEERS, NOT JUST FOR BOARDROOMS
            </p>
          </div>

          {/* Drawing title block */}
          <div className="relative">
            <div
              className="absolute -top-6 left-8 right-8 hidden h-3 border-x border-t border-dashed border-blue-300 lg:block"
              aria-hidden="true"
            />

            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 shadow-2xl shadow-blue-900/10 backdrop-blur-sm">
              <div className="hazard-stripe h-1.5" aria-hidden="true" />
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <span className="font-mono text-xs tracking-widest text-gray-400">
                  TITLE BLOCK
                </span>
                <span className="flex items-center gap-2 font-mono text-xs tracking-widest text-blue-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  LIVE
                </span>
              </div>

              <dl className="divide-y divide-gray-100">
                {titleBlock.map((row) => (
                  <div
                    key={row.field}
                    className="grid grid-cols-[7rem_1fr] items-center gap-4 px-6 py-3.5"
                  >
                    <dt className="font-mono text-xs tracking-widest text-gray-400">
                      {row.field}
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutHero;
