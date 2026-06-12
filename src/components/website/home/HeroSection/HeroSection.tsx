import { Link } from 'react-router-dom';

/**
 * HeroSection
 *
 * Light, blueprint-themed home hero. Copy and CTAs on the left; on the right a
 * schematic "one platform" diagram — a central BuildOpt hub wired to the four
 * things every site juggles (labor, materials, equipment, timeline). It
 * introduces what the system *is* rather than faking live data.
 */
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
              in one intelligent command center - so every part of your
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
               · LABOR / MATERIALS / EQUIPMENT / TIMELINE
            </p>
          </div>

          {/* Hero image */}
          <div className="relative">
            <div
              className="absolute -top-6 left-8 right-8 hidden h-3 border-x border-t border-dashed border-blue-300 lg:block"
              aria-hidden="true"
            />

            <div className="relative rounded-2xl border border-gray-200 bg-white/70 p-3 shadow-2xl shadow-blue-900/10 backdrop-blur-sm">
              <img
                src="/heroSection.png"
                alt="BuildOpt platform overview"
                className="w-full rounded-xl object-cover"
              />
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
