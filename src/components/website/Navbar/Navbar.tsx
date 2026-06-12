import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Contact', to: '/contact' },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5" onClick={closeMenu}>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            BuildOpt <span className="text-blue-600">5.0</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            to="/contact"
            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 sm:block md:block"
          >
            Sign in
          </Link>
          <Link
            to="/contact"
            className="hidden rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 md:block"
          >
            Get Started
          </Link>

          {/* Mobile hamburger */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-gray-200/70 bg-white/95 px-4 pb-4 pt-2 md:hidden">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `block rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
          ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
            <Link
              to="/contact"
              onClick={closeMenu}
              className="block rounded-lg px-3.5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              to="/contact"
              onClick={closeMenu}
              className="block rounded-lg bg-blue-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
