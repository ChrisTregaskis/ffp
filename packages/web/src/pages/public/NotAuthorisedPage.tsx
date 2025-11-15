/**
 * 403 Not Authorised page.
 *
 * Displayed when a user attempts to access a route they don't have
 * permission to view. This can occur if:
 * - User's role doesn't have access to the resource
 * - User's session has expired
 * - User is accessing a tenant-specific resource from wrong tenant
 */
export function NotAuthorisedPage(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-900">403</h1>
        <h2 className="mt-4 text-xl font-semibold uppercase tracking-wider text-gray-600">
          Not Authorised
        </h2>
        <p className="mt-4 text-gray-600">You do not have permission to access this page.</p>
        <div className="mt-8">
          <a
            href="/"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
