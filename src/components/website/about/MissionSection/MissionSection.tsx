/**
 * MissionSection
 *
 * The "why we exist" story. Left column carries the narrative; the right is a
 * schematic panel contrasting the fragmented status quo with the single
 * BuildOpt command center it replaces.
 */
const fragmented = [
  'Spreadsheets for labor',
  'WhatsApp groups for updates',
  'Whiteboards for the schedule',
  'Radios for equipment',
  'Receipts for materials',
];

function MissionSection() {
  return (
    <section className="bg-gray-50 py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Copy */}
        <div>
          <p className="font-mono text-xs tracking-widest text-blue-600">
            · OUR MISSION
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            One source of truth for the whole site
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            On most projects the information that runs the job is scattered
            across a dozen tools that never talk to each other. A delay in one
            place is invisible everywhere else until it's too late.
          </p>
          <p className="mt-4 text-lg text-gray-600">
            We're building BuildOpt so site teams stop stitching that picture
            together by hand. Every worker, machine, material and milestone in
            one system — so a change anywhere updates the plan everywhere.
          </p>
        </div>

        {/* Status-quo → BuildOpt panel */}
        <div className="relative">
          <div
            className="absolute -inset-6 rounded-3xl bg-blueprint-grid opacity-60"
            aria-hidden="true"
          />
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-blue-900/5">
            <p className="font-mono text-xs tracking-widest text-gray-400">
              TODAY — FRAGMENTED
            </p>
            <ul className="mt-4 space-y-2.5">
              {fragmented.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-gray-400 line-through decoration-amber-400/70"
                >
                  <span className="h-1.5 w-1.5 rotate-45 bg-gray-300" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="my-6 flex items-center gap-3 font-mono text-xs tracking-widest text-blue-600">
              <span className="h-px flex-1 bg-gray-200" />
              CONSOLIDATED INTO
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-mono text-sm font-bold text-white">
                B
              </span>
              <div>
                <p className="font-semibold text-gray-900">
                  BuildOpt — one command center
                </p>
                <p className="text-sm text-gray-600">
                  Labor, materials, equipment and timeline, in sync.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MissionSection;
