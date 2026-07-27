/**
 * Loader
 *
 * The first thing a visitor sees: a clean white screen with the BuildOpt 5.0
 * wordmark centered. A blueprint-style "draw line" sweeps beneath it while the
 * app boots, then the landing page is revealed.
 */
function Loader() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white">
      {/* Faint blueprint grid, matching the rest of the site. */}
      <div className="bg-blueprint-grid pointer-events-none absolute inset-0" />

      <div className="relative flex flex-col items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          BuildOpt <span className="text-blue-600">5.0</span>
        </h1>

        {/* Plotter track: a faint guide line with a blue segment sweeping it. */}
        <div className="relative mt-5 h-px w-44 overflow-hidden bg-gray-200">
          <span className="animate-loader-sweep absolute top-0 h-px w-[40%] bg-blue-600" />
        </div>

        <p className="animate-loader-blink mt-4 font-mono text-[11px] uppercase tracking-[0.25em] text-gray-400">
          Drafting workspace
        </p>
      </div>
    </div>
  );
}

export default Loader;
