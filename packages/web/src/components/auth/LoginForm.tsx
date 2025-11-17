import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button/Button';
import { Card } from '@web/components/Card/Card';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { Form } from '@web/components/form';
import { routes, RouteKey } from '@web/pages/routes';

import { loginFields, type LoginFormData } from '.';

export interface LoginFormProps {
  /** Callback when form is submitted */
  onSubmit: (data: LoginFormData) => Promise<void>;
  /** Loading state during authentication */
  isLoading?: boolean;
  /** Error message from authentication */
  error?: string | null;
  /** Clear error on user interaction */
  onClearError?: () => void;
}

/**
 * Login form organism component.
 *
 * Uses config-driven form pattern with Field[] configuration.
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}) => {
  const navigate = useNavigate();

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (data: LoginFormData): Promise<void> => {
      if (onClearError) {
        onClearError();
      }
      await onSubmit(data);
    },
    [onClearError, onSubmit]
  );

  // Handle forgot password navigation
  const handleForgotPassword = useCallback((): void => {
    void navigate(routes[RouteKey.FORGOT_PASSWORD].path);
  }, [navigate]);

  return (
    <Card title="Welcome back" subtitle="Sign into your physiotherapy account." centerHeader>
      {/* Error display */}
      {error && (
        <StaticAlert variant="error" message={error} onDismiss={onClearError} className="mb-6" />
      )}

      {/* Login form */}
      <div className="space-y-6">
        <Form
          fields={loginFields}
          onSubmit={handleFormSubmit}
          submitLabel={isLoading ? 'Signing in...' : 'Sign in'}
          isSubmitting={isLoading}
        />

        {/* Forgot password link */}
        <div className="flex justify-center -mt-2">
          <Button
            variant="link"
            size="sm"
            onClick={handleForgotPassword}
            type="button"
            disabled={isLoading}
          >
            Forgot password?
          </Button>
        </div>
      </div>
    </Card>
  );
};
