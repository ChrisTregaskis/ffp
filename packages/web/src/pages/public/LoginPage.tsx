/**
 * Login page component (placeholder).
 *
 * This is a basic placeholder that will be replaced with full Cognito
 * authentication in FFP-92.
 *
 * Future implementation will include:
 * - Email/password form with react-hook-form
 * - Cognito authentication via useAuth hook
 * - Error handling and validation
 * - Redirect to home after successful login
 */
export function LoginPage(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">Fit For Purpose</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Sign in to your account</p>
        </div>

        <div className="rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-700">Login functionality will be implemented in FFP-92</p>
        </div>

        <form className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                disabled
                className="relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                disabled
                className="relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sign in (Coming soon)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
