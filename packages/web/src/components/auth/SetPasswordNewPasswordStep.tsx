import { Button } from '@web/components/atoms';
import { ComposableForm } from '@web/components/organisms';
import type { NewPasswordFieldsState } from '@web/hooks/useNewPasswordFields';

import { AuthFormCard } from './AuthFormCard';
import { NewPasswordFields } from './NewPasswordFields';

export interface SetPasswordNewPasswordStepProps {
  email?: string;
  /** From `useNewPasswordFields` */
  newPassword: NewPasswordFieldsState;
  isLoading: boolean;
  error: string | null;
  onDismissError: () => void;
  onSubmit: () => Promise<void>;
  /** Leave out when there is no credentials step to return to */
  onGoBack?: () => void;
}

/** Set-password step 2: choose the permanent password. */
export const SetPasswordNewPasswordStep: React.FC<SetPasswordNewPasswordStepProps> = ({
  email,
  newPassword,
  isLoading,
  error,
  onDismissError,
  onSubmit,
  onGoBack,
}) => (
  <AuthFormCard
    title="Create your password"
    subtitle={`Set a secure password for ${email ?? 'your account'}.`}
    error={error}
    onDismissError={onDismissError}
  >
    <ComposableForm onSubmit={onSubmit} className="space-y-6">
      <NewPasswordFields
        newPassword={newPassword}
        isLoading={isLoading}
        submitLabel={isLoading ? 'Setting password...' : 'Set password'}
      />

      {onGoBack && (
        <div className="flex justify-center -mt-2">
          <Button variant="link" size="sm" onClick={onGoBack} type="button" disabled={isLoading}>
            Go back
          </Button>
        </div>
      )}
    </ComposableForm>
  </AuthFormCard>
);
