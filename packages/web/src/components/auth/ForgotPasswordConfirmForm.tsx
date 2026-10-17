import { ComposableForm } from '@web/components/organisms';
import { useNewPasswordFields } from '@web/hooks/useNewPasswordFields';

import { AuthFormCard } from './AuthFormCard';
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
 * The verification code is a form field; the new password is controlled state, for its live
 * strength reading.
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
  const newPassword = useNewPasswordFields();

  const handleFormSubmit = async (data: ConfirmResetFormValues): Promise<void> => {
    await onSubmit(data.code, newPassword.password);
  };

  return (
    <AuthFormCard
      title="Set a new password"
      subtitle="Enter the verification code sent to your email and choose a new password."
      error={error}
      onDismissError={onClearError}
    >
      <ComposableForm<ConfirmResetFormValues>
        onSubmit={handleFormSubmit}
        defaultValues={{ code: '' }}
        className="space-y-6"
      >
        <ForgotPasswordConfirmFormFields
          onResendCode={onResendCode}
          isLoading={isLoading}
          resendCooldown={resendCooldown}
          newPassword={newPassword}
          onBackToLogin={onBackToLogin}
        />
      </ComposableForm>
    </AuthFormCard>
  );
};
