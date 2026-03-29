import { Button } from '@web/components/button/Button';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { PasswordInput } from '@web/components/form/password/PasswordInput';
import { PasswordRequirementsList } from '@web/components/form/password/PasswordRequirementsList';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';
import type { PasswordValidationResult } from '@web/utils/passwordStrength';

/** Form values managed by ComposableForm / react-hook-form */
export interface ConfirmResetFormValues {
  code: string;
}

export interface ForgotPasswordConfirmFormFieldsProps {
  onResendCode: () => Promise<void>;
  isLoading: boolean;
  resendCooldown: number;
  password: string;
  onPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  passwordValidation: PasswordValidationResult;
  passwordsMatch: boolean;
  showConfirmPasswordError: boolean;
  onBackToLogin: () => void;
}

/**
 * Inner form fields for the forgot password confirm step.
 *
 * Accesses ComposableForm context for the verification code field,
 * and uses controlled PasswordInput for password entry with strength feedback.
 *
 * Must be rendered within a `<ComposableForm<ConfirmResetFormValues>>`.
 */
export const ForgotPasswordConfirmFormFields: React.FC<ForgotPasswordConfirmFormFieldsProps> = ({
  onResendCode,
  isLoading,
  resendCooldown,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  passwordValidation,
  passwordsMatch,
  showConfirmPasswordError,
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

      {/* New password input with strength indicator */}
      <PasswordInput
        label="New password"
        placeholder="Create a secure password"
        value={password}
        onChange={onPasswordChange}
        name="password"
        strength={passwordValidation.strength}
        showStrength
        disabled={isLoading}
      />

      {/* Password requirements list */}
      <PasswordRequirementsList requirements={passwordValidation.requirements} />

      {/* Confirm password input */}
      <PasswordInput
        label="Confirm password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        name="confirmPassword"
        hasError={showConfirmPasswordError}
        errorMessage="Passwords do not match"
        disabled={isLoading}
      />

      {/* Submit button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isLoading || !passwordValidation.allRequirementsMet || !passwordsMatch}
      >
        {isLoading ? 'Resetting password...' : 'Reset password'}
      </Button>

      {/* Back to sign in link */}
      <div className="flex justify-center -mt-2">
        <Button variant="link" size="sm" onClick={onBackToLogin} type="button" disabled={isLoading}>
          Back to sign in
        </Button>
      </div>
    </>
  );
};
