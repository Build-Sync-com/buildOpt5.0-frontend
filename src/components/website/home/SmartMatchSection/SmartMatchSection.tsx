const matchSignals = [
  {
    title: 'Skills & certifications',
    description: 'Only workers qualified for the task make the shortlist.',
  },
  {
    title: 'Availability & location',
    description: 'Cross-checked against shifts, leave and distance to site.',
  },
  {
    title: 'Past performance',
    description: 'Ratings from previous tasks weight every recommendation.',
  },
];

function SmartMatchSection() {
  return (
    <section className="overflow-hidden bg-gray-50 py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Smart match image */}
        <div className="relative order-last lg:order-first">
          <div
            className="absolute -inset-6 rounded-3xl bg-blueprint-grid opacity-60"
            aria-hidden="true"
          />
          <div className="relative rounded-2xl border border-gray-200 bg-white p-3 shadow-xl shadow-blue-900/5">
            <img
              src="/smartMatchSection.png"
              alt="SmartMatch crew assignment interface"
              className="w-full rounded-xl object-cover"
            />
          </div>
        </div>

        {/* Copy */}
        <div>
          <p className="font-mono text-xs tracking-widest text-blue-600">
            · INTELLIGENCE
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            The right crew for every task, found in seconds
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Describe the task — BuildOpt ranks your entire workforce against it.
            No more ringing around supervisors to find out who is free,
            qualified and nearby.
          </p>

          <dl className="mt-8 space-y-6">
            {matchSignals.map((signal, index) => (
              <div key={signal.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 font-mono text-xs font-bold text-amber-700">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <dt className="font-semibold text-gray-900">{signal.title}</dt>
                  <dd className="mt-0.5 text-gray-600">{signal.description}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export default SmartMatchSection;
