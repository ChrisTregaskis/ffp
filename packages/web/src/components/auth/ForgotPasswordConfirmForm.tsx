import { useMemo, useState } from 'react';

import { Card } from '@web/components/Card/Card';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { ComposableForm } from '@web/components/form/composableForm';
import { validatePassword } from '@web/utils/passwordStrength';

import {
  ForgotPasswordConfirmFormFields,
  type ConfirmResetFormValues,
} from './ForgotPasswordConfirmFormFields';

export interface ForgotPasswordConfirmFormProps {
  /** Callback when code and new password are submitted */
  onSubmit: (code: string, newPassword: string) => Promise<void>;
  /** Callback to resend the verification code */
  onResendCode: () => Promise<void>;
  /** Whether the form is submitting */
  isLoading: boolean;
  /** Error message to display */
  error: string | null;
  /** Clear the error message */
  onClearError: () => void;
  /** Navigate back to sign in */
  onBackToLogin: () => void;
  /** Current resend cooldown in seconds */
  resendCooldown: number;
}

/**
 * Forgot password confirm form — step 2 of the reset flow.
 *
 * Uses ComposableForm for the verification code field and controlled
 * PasswordInput components for password entry with real-time strength feedback.
 */
export const ForgotPasswordConfirmForm: React.FC<ForgotPasswordConfirmFormProps> = ({
  onSubmit,
  onResendCode,
  isLoading,
  error,
  onClearError,
  onBackToLogin,
  resendCooldown,
}) => {
  // Password state — controlled for real-time strength validation
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const passwordsMatch = password === confirmPassword;
  const showConfirmPasswordError = Boolean(
    confirmPasswordTouched && confirmPassword && !passwordsMatch
  );

  const handleFormSubmit = async (data: ConfirmResetFormValues): Promise<void> => {
    await onSubmit(data.code, password);
  };

  return (
    <Card
      title="Set a new password"
      subtitle="Enter the verification code sent to your email and choose a new password."
      centerHeader
    >
      {error && (
        <StaticAlert variant="error" message={error} onDismiss={onClearError} className="mb-6" />
      )}

      <ComposableForm<ConfirmResetFormValues>
        onSubmit={handleFormSubmit}
        defaultValues={{ code: '' }}
        className="space-y-6"
      >
        <ForgotPasswordConfirmFormFields
          onResendCode={onResendCode}
          isLoading={isLoading}
          resendCooldown={resendCooldown}
          password={password}
          onPasswordChange={setPassword}
          confirmPassword={confirmPassword}
          onConfirmPasswordChange={(value) => {
            setConfirmPassword(value);
            setConfirmPasswordTouched(true);
          }}
          passwordValidation={passwordValidation}
          passwordsMatch={passwordsMatch}
          showConfirmPasswordError={showConfirmPasswordError}
          onBackToLogin={onBackToLogin}
        />
      </ComposableForm>
    </Card>
  );
};
