import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { SetPasswordForm } from '@web/components/auth/SetPasswordForm';
import { AuthLayout } from '@web/components/layout/AuthLayout';
import { useAuth } from '@web/contexts/AuthContext';
import { RouteKey, routes } from '@web/pages/routes';

/**
 * Set password page component.
 *
 * Allows invited users to set their permanent password after receiving
 * a temporary password via email invitation.
 *
 * Flow varies based on entry point:
 *
 * **From login page (skipTempPassword=true):**
 * 1. User sets new password (Cognito session already active from login)
 * 2. User is automatically authenticated and redirected to home
 *
 * **Direct access:**
 * 1. User enters email and temporary password
 * 2. User sets new password (triggers Cognito NEW_PASSWORD_REQUIRED challenge)
 * 3. User is automatically authenticated and redirected to home
 *
 * Can be accessed via:
 * - Direct link: /set-password?email=user@example.com
 * - Redirect from login page: /set-password?email=user@example.com&skipTempPassword=true
 */
export const SetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // Get email from URL params if provided
  const initialEmail = searchParams.get('email') ?? undefined;
  // Check if user was redirected from login (already authenticated with temp password)
  const skipTempPassword = searchParams.get('skipTempPassword') === 'true';

  /**
   * Handle successful password setup
   *
   * After password is set via confirmSignIn, user is authenticated.
   * Refresh auth state and navigate to home page.
   */
  const handleSuccess = useCallback(async (): Promise<void> => {
    try {
      // Refresh auth state to populate user context from new session
      await checkAuth();

      // Navigate to home page
      void navigate(routes[RouteKey.HOME].path);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete authentication';
      setError(errorMessage);
    }
  }, [checkAuth, navigate]);

  /**
   * Clear error message
   */
  const handleClearError = useCallback((): void => {
    setError(null);
  }, []);

  return (
    <AuthLayout>
      <SetPasswordForm
        onSuccess={handleSuccess}
        initialEmail={initialEmail}
        skipTempPasswordStep={skipTempPassword}
        error={error}
        onClearError={handleClearError}
      />
    </AuthLayout>
  );
};
