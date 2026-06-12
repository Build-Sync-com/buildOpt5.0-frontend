/**
 * Loader
 *
 * The first thing a visitor sees: a clean white screen with the BuildOpt 5.0
 * wordmark centered. Shown while the app boots, then the landing page is
 * revealed.
 */
function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        BuildOpt 5.0
      </h1>
    </div>
  );
}

export default Loader;
