import { Link } from 'react-router-dom';

/**
 * Footer
 *
 * Bottom-of-page footer for the public marketing website: brand blurb plus
 * grouped navigation, over a thin hazard-stripe accent.
 */
const footerNav = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Get started', to: '/contact' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
    ],
  },
];

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="hazard-stripe h-1.5" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-sm">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4v18" />
                  <path d="M19 21V11l-6-4" />
                  <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
                </svg>
              </span>
              <span className="text-lg font-bold tracking-tight text-gray-900">
                BuildOpt <span className="text-blue-600">5.0</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              All-in-one construction site management — labor, materials,
              equipment and timelines in one intelligent command center.
            </p>
            <p className="mt-5 font-mono text-xs tracking-widest text-gray-400">
              DWG-001 · SITE OS v5.0
            </p>
          </div>

          {/* Nav groups */}
          {footerNav.map((group) => (
            <div key={group.heading}>
              <h3 className="font-mono text-xs tracking-widest text-gray-400">
                {group.heading.toUpperCase()}
              </h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-600 transition-colors hover:text-blue-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-6 sm:flex-row">
          <p className="text-sm text-gray-400">
            © {year} BuildOpt. All rights reserved.
          </p>
          <p className="text-sm text-gray-400">
            Built for the way construction actually runs.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
