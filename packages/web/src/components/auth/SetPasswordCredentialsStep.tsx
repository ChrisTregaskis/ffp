import { ComposableForm } from '@web/components/organisms';
import type { SetPasswordCredentialsData } from '@web/schemas/auth.schema';

import { AuthFormCard } from './AuthFormCard';
import { SetPasswordCredentialsFields } from './SetPasswordCredentialsFields';

export interface SetPasswordCredentialsStepProps {
  initialEmail?: string;
  isLoading: boolean;
  error: string | null;
  onDismissError: () => void;
  onSubmit: (data: SetPasswordCredentialsData) => Promise<void>;
}

/** Set-password step 1: the invited user's email and the temporary password they were sent. */
export const SetPasswordCredentialsStep: React.FC<SetPasswordCredentialsStepProps> = ({
  initialEmail,
  isLoading,
  error,
  onDismissError,
  onSubmit,
}) => (
  <AuthFormCard
    title="Set your password"
    subtitle="Enter your email and temporary password to get started."
    error={error}
    onDismissError={onDismissError}
  >
    <ComposableForm<SetPasswordCredentialsData>
      onSubmit={onSubmit}
      defaultValues={{ email: initialEmail ?? '', temporaryPassword: '' }}
      className="space-y-4"
    >
      <SetPasswordCredentialsFields isLoading={isLoading} />
    </ComposableForm>
  </AuthFormCard>
);
