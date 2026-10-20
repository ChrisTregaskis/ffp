import { Button } from '@web/components/atoms';
import { FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';
import type { NewPasswordFieldsState } from '@web/hooks/useNewPasswordFields';

import { NewPasswordFields } from './NewPasswordFields';

/** Form values managed by ComposableForm / react-hook-form */
export interface ConfirmResetFormValues {
  code: string;
}

export interface ForgotPasswordConfirmFormFieldsProps {
  onResendCode: () => Promise<void>;
  isLoading: boolean;
  resendCooldown: number;
  newPassword: NewPasswordFieldsState;
  onBackToLogin: () => void;
}

/**
 * Inner form fields for the forgot password confirm step.
 *
 * Accesses ComposableForm context for the verification code field; the new password is
 * controlled state from `useNewPasswordFields`.
 *
 * Must be rendered within a `<ComposableForm<ConfirmResetFormValues>>`.
 */
export const ForgotPasswordConfirmFormFields: React.FC<ForgotPasswordConfirmFormFieldsProps> = ({
  onResendCode,
  isLoading,
  resendCooldown,
  newPassword,
  onBackToLogin,
}) => {
  const { register, errors } = useComposableFormContext<ConfirmResetFormValues>();

  return (
    <>
      {/* Verification code input */}
      <div className="space-y-2">
        <FormTextInput<ConfirmResetFormValues>
          name="code"
          label="Verification code"
          placeholder="Enter 6-digit code"
          register={register}
          errors={errors}
          disabled={isLoading}
          registerOptions={{
            required: 'Verification code is required',
            pattern: { value: /^\d{6}$/, message: 'Code must be 6 digits' },
          }}
          inputProps={{
            inputMode: 'numeric',
            autoComplete: 'one-time-code',
          }}
          inputClassName="tracking-widest"
        />

        <div className="flex justify-end">
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              void onResendCode();
            }}
            type="button"
            disabled={isLoading || resendCooldown > 0}
          >
            {resendCooldown > 0 ? `Resend code (${resendCooldown.toString()}s)` : 'Resend code'}
          </Button>
        </div>
      </div>

      <NewPasswordFields
        newPassword={newPassword}
        isLoading={isLoading}
        submitLabel={isLoading ? 'Resetting password...' : 'Reset password'}
      />

      {/* Back to sign in link */}
      <div className="flex justify-center -mt-2">
        <Button variant="link" size="sm" onClick={onBackToLogin} type="button" disabled={isLoading}>
          Back to sign in
        </Button>
      </div>
    </>
  );
};
