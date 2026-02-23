import {
  ComponentPageWrapper,
  ComponentPageHeader,
  ComponentSection,
  DeveloperInstructions,
} from '@web/components/dev';
import { Form, type Field, FieldDataType } from '@web/components/form';
import { Text, Title } from '@web/components/text';
import { useAuth } from '@web/hooks/useAuth';

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
 *
 * Demonstrates the Form component with a live authentication flow.
 * This page is interactive rather than purely visual — it connects
 * to the AuthContext for real login/logout behaviour.
 */
export const FormComponentsPage = (): JSX.Element => {
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
    <ComponentPageWrapper maxWidth="4xl">
      <ComponentPageHeader
        title="Form Components"
        description="Interactive demonstrations of form inputs, validation, and submission handling"
        showBackLink
      />

      <ComponentSection title="Authentication Form">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Live authentication flow using the Form component with email/password validation. Connect
          to the AuthContext for real login/logout behaviour.
        </Text>

        <div className="rounded-lg bg-white p-8 shadow">
          <Title as="h2" className="mb-4 text-gray-900">
            Authentication Form
          </Title>
          <Text as="p" className="mb-6 text-gray-600" styleProps={{ size: 'sm' }}>
            Test the authentication flow with email/password validation
          </Text>

          {/* Loading state during initial auth check */}
          {loading && !user && (
            <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4">
              <Text as="p" className="text-blue-800" styleProps={{ size: 'sm' }}>
                Checking authentication...
              </Text>
            </div>
          )}

          {/* Display authenticated user */}
          {user && (
            <div className="mb-6">
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-4">
                <Text
                  as="p"
                  className="mb-2 text-green-800"
                  styleProps={{ size: 'sm', weight: 'medium' }}
                >
                  ✓ Authenticated User:
                </Text>
                <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-green-700">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              <button
                onClick={() => void handleLogout()}
                disabled={loading}
                className="w-full rounded-md bg-red-600 px-4 py-2 transition-colours hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                <Text className="text-white" styleProps={{ weight: 'medium' }}>
                  {loading ? 'Logging out...' : 'Logout'}
                </Text>
              </button>
            </div>
          )}

          {/* Login form (only show if not authenticated) */}
          {!user && (
            <>
              <div className="mb-6 space-y-2 rounded-md bg-gray-50 p-4">
                <Text
                  as="p"
                  className="text-gray-700"
                  styleProps={{ size: 'sm', weight: 'medium' }}
                >
                  Features:
                </Text>
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    <Text className="text-gray-600" styleProps={{ size: 'sm' }}>
                      Email validation (valid format required)
                    </Text>
                  </li>
                  <li>
                    <Text className="text-gray-600" styleProps={{ size: 'sm' }}>
                      Password validation (minimum 8 characters)
                    </Text>
                  </li>
                  <li>
                    <Text className="text-gray-600" styleProps={{ size: 'sm' }}>
                      Loading state during submission
                    </Text>
                  </li>
                  <li>
                    <Text className="text-gray-600" styleProps={{ size: 'sm' }}>
                      User object with tenantId and role after success
                    </Text>
                  </li>
                  <li>
                    <Text className="text-gray-600" styleProps={{ size: 'sm' }}>
                      Error display on authentication failure
                    </Text>
                  </li>
                </ul>
              </div>

              {/* Display authentication errors */}
              {error && (
                <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
                  <Text
                    as="p"
                    className="mb-1 text-red-800"
                    styleProps={{ size: 'sm', weight: 'medium' }}
                  >
                    Authentication Error:
                  </Text>
                  <Text as="p" className="text-red-700" styleProps={{ size: 'sm' }}>
                    {error}
                  </Text>
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
      </ComponentSection>

      {/* Developer instructions */}
      <DeveloperInstructions title="Developer Tools">
        <ul className="space-y-1">
          <li>• Check browser console for login/logout logs</li>
          <li>• Access auth context via React DevTools (AuthProvider component)</li>
          <li>• Verify JWT claims in Network tab (Authorization header)</li>
          <li>• Form validation runs on blur and submit</li>
        </ul>
      </DeveloperInstructions>
    </ComponentPageWrapper>
  );
};
