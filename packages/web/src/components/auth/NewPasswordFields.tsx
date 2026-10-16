import { Button } from '@web/components/atoms';
import { PasswordInput, PasswordRequirementsList } from '@web/components/molecules';
import type { NewPasswordFieldsState } from '@web/hooks/useNewPasswordFields';

export interface NewPasswordFieldsProps {
  /** From `useNewPasswordFields` */
  newPassword: NewPasswordFieldsState;
  isLoading: boolean;
  submitLabel: string;
}

/** The new password with its strength and requirements, its confirmation, and the submit button. */
export const NewPasswordFields: React.FC<NewPasswordFieldsProps> = ({
  newPassword,
  isLoading,
  submitLabel,
}) => (
  <>
    <PasswordInput
      label="New password"
      placeholder="Create a secure password"
      value={newPassword.password}
      onChange={newPassword.setPassword}
      name="password"
      strength={newPassword.validation.strength}
      showStrength
      disabled={isLoading}
    />

    <PasswordRequirementsList requirements={newPassword.validation.requirements} />

    <PasswordInput
      label="Confirm password"
      placeholder="Re-enter your password"
      value={newPassword.confirmPassword}
      onChange={newPassword.setConfirmPassword}
      name="confirmPassword"
      hasError={newPassword.showConfirmPasswordError}
      errorMessage="Passwords do not match"
      disabled={isLoading}
    />

    <Button
      type="submit"
      variant="primary"
      size="lg"
      className="w-full"
      disabled={isLoading || !newPassword.isReady}
    >
      {submitLabel}
    </Button>
  </>
);
