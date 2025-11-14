import React from 'react';

import { Form, type Field, FieldDataType } from '../components/form';
import { useAuth } from '../contexts/AuthContext';

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
 * Test page for authentication flow (FFP-90)
 *
 * Tests:
 * - Login form with email/password validation
 * - Auth context integration (useAuth hook)
 * - Loading state during authentication
 * - User object display after successful login
 * - Error handling and display
 * - Logout functionality
 *
 * Expected user object structure:
 * - userId (string): Cognito user ID
 * - email (string): User's email address
 * - tenantId (string): Extracted from custom:tenantId JWT claim
 * - role (string): Extracted from custom:role JWT claim
 */
export const FormTest: React.FC = () => {
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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Authentication Test (FFP-90)</h1>

        {/* Loading state during initial auth check */}
        {loading && !user && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">Checking authentication...</p>
          </div>
        )}

        {/* Display authenticated user */}
        {user && (
          <div className="mb-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
              <p className="text-sm font-medium text-green-800 mb-2">✓ Authenticated User:</p>
              <pre className="text-xs text-green-700 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            <button
              onClick={() => void handleLogout()}
              disabled={loading}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        )}

        {/* Login form (only show if not authenticated) */}
        {!user && (
          <>
            <p className="text-sm text-gray-600 mb-6">
              Test the authentication flow with valid credentials:
            </p>
            <ul className="text-sm text-gray-600 mb-6 list-disc list-inside space-y-1">
              <li>Email validation (valid format required)</li>
              <li>Password validation (minimum 8 characters)</li>
              <li>Loading state during login</li>
              <li>User object with tenantId and role after success</li>
              <li>Error display on authentication failure</li>
            </ul>

            {/* Display authentication errors */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm font-medium text-red-800 mb-1">Authentication Error:</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Form
              fields={loginFields}
              onSubmit={handleSubmit}
              submitLabel={loading ? 'Logging in...' : 'Login'}
              isSubmitting={loading}
            />

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs font-medium text-yellow-800 mb-2">Test Credentials:</p>
              <p className="text-xs text-yellow-700">
                Use valid credentials from your Cognito User Pool.
                <br />
                User must have custom:tenantId and custom:role attributes set.
              </p>
            </div>
          </>
        )}

        {/* Developer instructions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Developer Tools:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Check browser console for login/logout logs</li>
            <li>• Access auth context via React DevTools (AuthProvider component)</li>
            <li>• Verify JWT claims in Network tab (Authorization header)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
