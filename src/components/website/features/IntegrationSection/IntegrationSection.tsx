/**
 * IntegrationSection
 *
 * Reinforces BuildOpt's core differentiator — the modules share one dataset.
 * Rendered as a schematic "wiring diagram": four module nodes connected to a
 * central core, with a worked example of one change rippling outward.
 */
const nodes = [
  { tag: 'LABOR', note: 'crew booked' },
  { tag: 'MATERIALS', note: 'stock drawn' },
  { tag: 'EQUIPMENT', note: 'mixer assigned' },
  { tag: 'TIMELINE', note: 'phase advanced' },
];

function IntegrationSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <p className="font-mono text-xs tracking-widest text-blue-600">
          · ONE SOURCE OF TRUTH
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Change it once. It's right everywhere.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Approve a concrete pour and BuildOpt books the crew, draws down the
          cement, assigns the mixer and advances the program — in a single move.
        </p>

        {/* Wiring diagram */}
        <div className="relative mt-14 overflow-hidden rounded-2xl border border-gray-200 bg-blueprint-grid p-8 sm:p-12">
          <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_auto_1fr]">
            {/* Left two nodes */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {nodes.slice(0, 2).map((n) => (
                <div
                  key={n.tag}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-left shadow-sm"
                >
                  <p className="font-mono text-xs tracking-widest text-blue-600">
                    {n.tag}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{n.note}</p>
                </div>
              ))}
            </div>

            {/* Core */}
            <div className="flex items-center justify-center">
              <div className="relative flex h-28 w-28 flex-col items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/30">
                <div
                  className="hazard-stripe absolute inset-x-0 top-0 h-1.5"
                  aria-hidden="true"
                />
                <span className="font-mono text-2xl font-bold">B</span>
                <span className="mt-1 font-mono text-[10px] tracking-widest text-blue-100">
                  CORE
                </span>
              </div>
            </div>

            {/* Right two nodes */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {nodes.slice(2).map((n) => (
                <div
                  key={n.tag}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-left shadow-sm"
                >
                  <p className="font-mono text-xs tracking-widest text-blue-600">
                    {n.tag}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{n.note}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 font-mono text-xs tracking-widest text-gray-400">
            FIG. 05 — ONE ACTION, FOUR MODULES UPDATED
          </p>
        </div>
      </div>
    </section>
  );
}

export default IntegrationSection;
