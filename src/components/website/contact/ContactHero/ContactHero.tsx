/**
 * ContactHero
 *
 * Intro band for the Contact page. Headline copy over the blueprint grid, with
 * a row of "site office" channel cards (email / phone / location) rendered as
 * small drawing-stamp tiles.
 */
const channels = [
  {
    tag: 'EMAIL',
    value: 'contact@buildopt.io',
    note: 'Replies within one business day',
    href: 'mailto:contact@buildopt.io',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    tag: 'PHONE',
    value: '+94 11 234 5678',
    note: 'Mon–Fri · 8.00–18.00',
    href: 'tel:+94112345678',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
      </svg>
    ),
  },
  {
    tag: 'SITE OFFICE',
    value: 'Colombo, Sri Lanka',
    note: 'Visits by appointment',
    href: null,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

function ContactHero() {
  return (
    <section className="relative overflow-hidden bg-blueprint-grid">
      {/* Soft radial glow so the grid fades out toward the edges */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_55%),radial-gradient(ellipse_at_bottom,white_30%,transparent_75%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-12 text-center sm:px-6 lg:px-8 lg:pt-24">
        <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-mono text-xs tracking-widest text-blue-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          SHEET 04 · CONTACT
        </p>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          Let's get your site{' '}
          <span className="relative whitespace-nowrap">
            <span className="absolute -inset-x-1 inset-y-1 -skew-y-1 rounded bg-amber-200/70" />
            <span className="relative">on the system</span>
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
          Tell us about your project and we'll set up a walkthrough tailored to
          how your team works. No sales scripts — just engineers who know the
          field.
        </p>

        {/* Channel tiles */}
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
          {channels.map((c) => {
            const inner = (
              <>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    {c.icon}
                  </span>
                  <span className="font-mono text-xs tracking-widest text-gray-400">
                    {c.tag}
                  </span>
                </div>
                <p className="mt-4 text-base font-semibold text-gray-900">
                  {c.value}
                </p>
                <p className="mt-1 text-sm text-gray-500">{c.note}</p>
              </>
            );

            const className =
              'group block rounded-2xl border border-gray-200 bg-white/80 p-5 text-left shadow-sm backdrop-blur-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5';

            return c.href ? (
              <a key={c.tag} href={c.href} className={className}>
                {inner}
              </a>
            ) : (
              <div key={c.tag} className={className}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ContactHero;
