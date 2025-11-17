import { useAuth } from '@web/contexts/AuthContext';

/**
 * Home/Dashboard page component (placeholder).
 *
 * This is a protected route that requires authentication.
 * Displays basic user information from the authenticated session.
 *
 * Future implementation will include:
 * - Dashboard widgets
 * - Recent activity
 * - Quick actions
 * - Navigation to assessments and programmes
 */
export const HomePage = (): JSX.Element => {
  const { user, logout } = useAuth();

  const handleLogout = (): void => {
    void logout();
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Sign out
          </button>
        </div>

        <div className="space-y-6">
          {/* User info card */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Welcome back!</h2>
            {user && (
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.role}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tenant ID</dt>
                  <dd className="mt-1 text-sm font-mono text-gray-900">{user.tenantId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm font-mono text-gray-900">{user.userId}</dd>
                </div>
              </dl>
            )}
          </div>

          {/* Placeholder content */}
          <div className="rounded-lg bg-blue-50 p-6">
            <h3 className="mb-2 text-lg font-medium text-blue-900">Coming Soon</h3>
            <p className="text-sm text-blue-700">
              Dashboard widgets, recent activity, and quick actions will be added in future sprints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
