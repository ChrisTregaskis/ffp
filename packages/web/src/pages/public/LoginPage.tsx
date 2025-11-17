import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type LoginFormData } from '@web/components/auth';
import { LoginForm } from '@web/components/auth/LoginForm';
import { AuthLayout } from '@web/components/layout/AuthLayout';
import { useAuth } from '@web/contexts/AuthContext';
import { RouteKey, routes } from '@web/pages/routes';

/**
 * Login page component.
 */
export const LoginPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle login form submission
   */
  const handleLogin = useCallback(
    async (data: LoginFormData): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        await login(data.email, data.password);

        // Redirect to home on successful login
        void navigate(routes[RouteKey.HOME].path);
      } catch (err) {
        // Display error message
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred during sign in';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [login, navigate]
  );

  /**
   * Clear error message
   */
  const handleClearError = useCallback((): void => {
    setError(null);
  }, []);

  return (
    <AuthLayout title="Welcome back">
      <LoginForm
        onSubmit={handleLogin}
        isLoading={isLoading}
        error={error}
        onClearError={handleClearError}
      />
    </AuthLayout>
  );
};
