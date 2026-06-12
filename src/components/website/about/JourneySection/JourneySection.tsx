/**
 * JourneySection
 *
 * Company milestones as a vertical "setting-out" line — markers pinned along a
 * single blue axis (MS-01 … MS-04), echoing the timeline language used across
 * the product without repeating the home page's Gantt chart.
 */
type Milestone = {
  code: string;
  year: string;
  title: string;
  description: string;
  accent?: boolean;
};

const milestones: Milestone[] = [
  {
    code: 'MS-01',
    year: '2023',
    title: 'An idea on the jobsite',
    description:
      'Watching a crane sit idle while a crew waited on the wrong floor, the founders sketched the first version of BuildOpt on the back of a drawing.',
  },
  {
    code: 'MS-02',
    year: '2024',
    title: 'First pilot pour',
    description:
      'BuildOpt ran its first live project — labor, materials and equipment tracked in one place, end to end, for a single contractor.',
  },
  {
    code: 'MS-03',
    year: '2025',
    title: 'SmartMatch goes live',
    description:
      'Intelligent crew matching shipped, ranking the whole workforce against any task by skill, availability and past performance.',
  },
  {
    code: 'MS-04',
    year: '2026',
    title: 'Site OS v5.0',
    description:
      'The four modules became one connected platform — the command center construction teams run their whole site from today.',
    accent: true,
  },
];

function JourneySection() {
  return (
    <section className="bg-gray-50 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-blue-600">
            · SETTING OUT
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How we got here
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From a sketch on a drawing to a platform running real sites — the
            milestones along the way.
          </p>
        </div>

        <ol className="mt-12 space-y-10 border-l-2 border-dashed border-blue-200 pl-8">
          {milestones.map((milestone) => (
            <li key={milestone.code} className="relative">
              {/* Axis marker */}
              <span
                className={`absolute -left-[2.6rem] top-1 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-gray-50 ${
                  milestone.accent ? 'bg-amber-400' : 'bg-blue-600'
                }`}
                aria-hidden="true"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-xs tracking-widest text-amber-600">
                  {milestone.code}
                </span>
                <span className="text-2xl font-bold tracking-tight text-blue-600">
                  {milestone.year}
                </span>
                <h3 className="text-lg font-semibold text-gray-900">
                  {milestone.title}
                </h3>
              </div>
              <p className="mt-2 text-gray-600">{milestone.description}</p>
            </li>
          ))}
        </ol>

        <p className="mt-12 text-center font-mono text-xs tracking-widest text-gray-400">
          FIG. 03 — STILL UNDER CONSTRUCTION
        </p>
      </div>
    </section>
  );
}

export default JourneySection;
