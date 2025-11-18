import { signIn } from 'aws-amplify/auth';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type LoginFormData } from '@web/components/auth';
import { LoginForm } from '@web/components/auth/LoginForm';
import { AuthLayout } from '@web/components/layout/AuthLayout';
import { useAuth } from '@web/contexts/AuthContext';
import { RouteKey, routes } from '@web/pages/routes';

/**
 * Login page component.
 *
 * Handles standard login flow and detects when users attempt to sign in
 * with a temporary password (NEW_PASSWORD_REQUIRED challenge), automatically
 * redirecting them to the set password page.
 */
export const LoginPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle login form submission
   *
   * Detects NEW_PASSWORD_REQUIRED challenge and redirects to set password page.
   * Otherwise, completes standard login flow.
   */
  const handleLogin = useCallback(
    async (data: LoginFormData): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        // Attempt sign in
        const result = await signIn({
          username: data.email,
          password: data.password,
        });

        // Check if user needs to set a new password (invited user with temporary password)
        // AWS `signInStep` type options: https://docs.amplify.aws/react/build-a-backend/auth/connect-your-frontend/multi-step-sign-in/
        if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
          // Redirect to set password page with email pre-filled
          // Add skipTempPassword=true to indicate user has already authenticated with temp password
          const setPasswordPath = routes[RouteKey.SET_PASSWORD].path;
          const emailParam = encodeURIComponent(data.email);
          void navigate(`${setPasswordPath}?email=${emailParam}&skipTempPassword=true`);
          return;
        }

        // Standard login flow - user is authenticated
        if (result.isSignedIn) {
          // Refresh auth context to populate user data
          await checkAuth();

          // Redirect to home on successful login
          void navigate(routes[RouteKey.HOME].path);
        } else {
          throw new Error('Unexpected sign-in state. Please try again.');
        }
      } catch (err) {
        // Display error message
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred during sign in';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [checkAuth, navigate]
  );

  /**
   * Clear error message
   */
  const handleClearError = useCallback((): void => {
    setError(null);
  }, []);

  return (
    <AuthLayout title="Fit For Purpose">
      <LoginForm
        onSubmit={handleLogin}
        isLoading={isLoading}
        error={error}
        onClearError={handleClearError}
      />
    </AuthLayout>
  );
};
