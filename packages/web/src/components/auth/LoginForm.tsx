import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/atoms';
import { ComposableForm } from '@web/components/organisms';
import { routes, RouteKey } from '@web/pages/routes';
import type { LoginFormData } from '@web/schemas/auth.schema';

import { AuthFormCard } from './AuthFormCard';
import { LoginFormFields } from './LoginFormFields';

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

const EMPTY_VALUES: LoginFormData = { email: '', password: '' };

/** The sign-in form, with a link to reset a forgotten password. */
export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}) => {
  const navigate = useNavigate();

  const handleFormSubmit = useCallback(
    async (data: LoginFormData): Promise<void> => {
      if (onClearError) {
        onClearError();
      }

      await onSubmit(data);
    },
    [onClearError, onSubmit]
  );

  const handleForgotPassword = useCallback((): void => {
    void navigate(routes[RouteKey.FORGOT_PASSWORD].path);
  }, [navigate]);

  return (
    <AuthFormCard
      title="Welcome back"
      subtitle="Sign into your physiotherapy account."
      error={error}
      onDismissError={onClearError}
    >
      <ComposableForm<LoginFormData>
        onSubmit={handleFormSubmit}
        defaultValues={EMPTY_VALUES}
        className="space-y-4"
      >
        <LoginFormFields isLoading={isLoading} />
      </ComposableForm>

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
    </AuthFormCard>
  );
};
