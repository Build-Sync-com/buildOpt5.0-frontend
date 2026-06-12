/**
 * TimelineSection
 *
 * "From groundbreak to handover" — the four project phases rendered as a
 * Gantt-style schedule: each phase is a row whose bar is offset along a
 * shared week grid, echoing the product's timeline module.
 */
type Phase = {
  code: string;
  title: string;
  description: string;
  /** Bar position on the week grid, in percent. */
  offset: number;
  width: number;
  barClass: string;
};

const phases: Phase[] = [
  {
    code: 'PH-01',
    title: 'Plan & estimate',
    description: 'Import BOQs, define phases and budget every resource.',
    offset: 0,
    width: 24,
    barClass: 'bg-blue-300',
  },
  {
    code: 'PH-02',
    title: 'Mobilize',
    description: 'Crews matched, materials ordered, machines scheduled.',
    offset: 16,
    width: 30,
    barClass: 'bg-blue-500',
  },
  {
    code: 'PH-03',
    title: 'Execute & track',
    description: 'Daily logs, live progress and instant delay alerts.',
    offset: 38,
    width: 44,
    barClass: 'bg-blue-700',
  },
  {
    code: 'PH-04',
    title: 'Handover',
    description: 'Snag lists closed out, documentation in one click.',
    offset: 76,
    width: 24,
    barClass: 'bg-amber-400',
  },
];

const weeks = ['W1', 'W3', 'W5', 'W7', 'W9', 'W11'];

function TimelineSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-blue-600">
            SHEET 04 · WORKFLOW
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            From groundbreak to handover, on schedule
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            BuildOpt follows the way construction actually runs — phase by
            phase, with every resource synchronized to the program.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-gray-200">
          {/* Week ruler */}
          <div className="grid grid-cols-1 border-b border-gray-200 bg-gray-50 md:grid-cols-[minmax(0,18rem)_1fr]">
            <div className="hidden px-6 py-3 font-mono text-xs tracking-widest text-gray-400 md:block">
              PHASE
            </div>
            <div className="flex justify-between px-6 py-3 font-mono text-xs text-gray-400">
              {weeks.map((week) => (
                <span key={week}>{week}</span>
              ))}
            </div>
          </div>

          {phases.map((phase) => (
            <div
              key={phase.code}
              className="grid grid-cols-1 border-b border-gray-100 last:border-b-0 md:grid-cols-[minmax(0,18rem)_1fr]"
            >
              <div className="px-6 pt-5 md:py-5">
                <p className="flex items-baseline gap-2.5">
                  <span className="font-mono text-xs text-amber-600">
                    {phase.code}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {phase.title}
                  </span>
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {phase.description}
                </p>
              </div>

              {/* Bar lane */}
              <div className="relative px-6 py-5 md:border-l md:border-gray-100">
                {/* Vertical week grid lines */}
                <div
                  className="absolute inset-y-0 left-6 right-6 hidden justify-between md:flex"
                  aria-hidden="true"
                >
                  {weeks.map((week) => (
                    <span key={week} className="w-px bg-gray-100" />
                  ))}
                </div>
                <div className="relative flex h-8 items-center md:h-full">
                  <div
                    className={`h-3.5 rounded-full ${phase.barClass}`}
                    style={{
                      marginLeft: `${phase.offset}%`,
                      width: `${phase.width}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center font-mono text-xs tracking-widest text-gray-400">
          FIG. 02 — RESOURCES SYNCHRONIZED TO THE PROGRAM
        </p>
      </div>
    </section>
  );
}

export default TimelineSection;
