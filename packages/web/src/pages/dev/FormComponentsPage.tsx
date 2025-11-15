import { Link } from 'react-router-dom';

import { Form, type Field, FieldDataType } from '@web/components/form';
import { useAuth } from '@web/contexts/AuthContext';

interface LoginFormValues {
  email: string;
  password: string;
}

const loginFields: Field<LoginFormValues>[] = [
  {
    order: 1,
    name: 'email',
    label: 'Email Address',
    dataType: FieldDataType.STRING,
    placeholder: 'you@example.com',
    validation: {
      isRequired: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },
  {
    order: 2,
    name: 'password',
    label: 'Password',
    dataType: FieldDataType.STRING,
    placeholder: '••••••••',
    validation: {
      isRequired: true,
      minLength: 8,
    },
  },
];

/**
 * Form components showcase page (development only).
 */
export function FormComponentsPage(): JSX.Element {
  const { user, loading, error, login, logout } = useAuth();

  const handleSubmit = async (values: LoginFormValues): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log('Login attempt:', { email: values.email });

    try {
      await login(values.email, values.password);
      // eslint-disable-next-line no-console
      console.log('Login successful!');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      // eslint-disable-next-line no-console
      console.log('Logout successful!');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/components"
            className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
          >
            ← Back to Components
          </Link>
          <div className="mb-4 inline-block rounded-md bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
            Development Only
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Form Components</h1>
          <p className="text-gray-600">
            Interactive demonstrations of form inputs, validation, and submission handling
          </p>
        </div>

        {/* Authentication Form Demo */}
        <div className="mb-8 rounded-lg bg-white p-8 shadow">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Authentication Form</h2>
          <p className="mb-6 text-sm text-gray-600">
            Test the authentication flow with email/password validation
          </p>

          {/* Loading state during initial auth check */}
          {loading && !user && (
            <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">Checking authentication...</p>
            </div>
          )}

          {/* Display authenticated user */}
          {user && (
            <div className="mb-6">
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-4">
                <p className="mb-2 text-sm font-medium text-green-800">✓ Authenticated User:</p>
                <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-green-700">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              <button
                onClick={() => void handleLogout()}
                disabled={loading}
                className="w-full rounded-md bg-red-600 px-4 py-2 text-white transition-colours hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}

          {/* Login form (only show if not authenticated) */}
          {!user && (
            <>
              <div className="mb-6 space-y-2 rounded-md bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700">Features:</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                  <li>Email validation (valid format required)</li>
                  <li>Password validation (minimum 8 characters)</li>
                  <li>Loading state during submission</li>
                  <li>User object with tenantId and role after success</li>
                  <li>Error display on authentication failure</li>
                </ul>
              </div>

              {/* Display authentication errors */}
              {error && (
                <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
                  <p className="mb-1 text-sm font-medium text-red-800">Authentication Error:</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Form
                fields={loginFields}
                onSubmit={handleSubmit}
                submitLabel={loading ? 'Logging in...' : 'Login'}
                isSubmitting={loading}
              />
            </>
          )}
        </div>

        {/* Developer instructions */}
        <div className="rounded-lg bg-blue-50 p-6">
          <h3 className="mb-2 text-sm font-semibold text-blue-900">Developer Tools</h3>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>• Check browser console for login/logout logs</li>
            <li>• Access auth context via React DevTools (AuthProvider component)</li>
            <li>• Verify JWT claims in Network tab (Authorization header)</li>
            <li>• Form validation runs on blur and submit</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
