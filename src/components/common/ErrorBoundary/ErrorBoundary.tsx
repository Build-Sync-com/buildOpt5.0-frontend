import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

/**
 * ErrorBoundary
 *
 * Route-level error element. Replaces React Router's default dev error screen
 * with a friendly message for unexpected errors (thrown render/loader errors).
 * Unmatched URLs are handled separately by the NotFound catch-all route.
 */
function ErrorBoundary() {
  const error = useRouteError();

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Something went wrong';

  const message = isRouteErrorResponse(error)
    ? 'The page could not be loaded.'
    : 'An unexpected error occurred. Please try again.';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
      <p className="max-w-md text-gray-500">{message}</p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Back to home
      </Link>
    </div>
  );
}

export default ErrorBoundary;
