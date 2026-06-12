import { Link } from 'react-router-dom';

/**
 * CtaSection
 *
 * Closing call-to-action band: deep blue with a faint blueprint grid and a
 * hazard-stripe top edge.
 */
function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-blue-700">
      <div className="hazard-stripe h-1.5" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="font-mono text-xs tracking-widest text-blue-200">
          PERMIT GRANTED · READY TO BUILD
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Break ground on better site management
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
          Bring labor, materials, machines and the schedule into one command
          center — and let BuildOpt find the best crew for every task.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/contact"
            className="rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-amber-300"
          >
            Get started today
          </Link>
          <Link
            to="/pricing"
            className="rounded-lg border border-blue-400 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
          >
            View pricing
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CtaSection;
