import { Link } from 'react-router-dom';

/**
 * NotFound (404) page — public website.
 *
 * Rendered for any URL that doesn't match a known route. Kept inside the
 * WebsiteLayout so the navbar/footer remain available to navigate back.
 */
function NotFound() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-4 py-32 text-center sm:px-6 lg:px-8">
      <p className="text-base font-semibold text-blue-600">404</p>
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">
        Page not found
      </h1>
      <p className="max-w-md text-gray-500">
        Sorry, we couldn’t find the page you’re looking for. It may have been
        moved or no longer exists.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Back to home
      </Link>
    </section>
  );
}

export default NotFound;
