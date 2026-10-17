import { Button } from '@web/components/atoms';
import { ComposableForm } from '@web/components/organisms';
import type { ForgotPasswordRequestData } from '@web/schemas/auth.schema';

import { AuthFormCard } from './AuthFormCard';
import { ForgotPasswordRequestFormFields } from './ForgotPasswordRequestFormFields';

export interface ForgotPasswordRequestFormProps {
  /** Callback when email is submitted */
  onSubmit: (data: ForgotPasswordRequestData) => Promise<void>;
  /** Whether the form is submitting */
  isLoading: boolean;
  /** Error message to display */
  error: string | null;
  /** Clear the error message */
  onClearError: () => void;
  /** Navigate back to sign in */
  onBackToLogin: () => void;
}

const EMPTY_VALUES: ForgotPasswordRequestData = { email: '' };

/**
 * Forgot password request form — step 1 of the reset flow.
 *
 * User enters their email address to receive a verification code.
 */
export const ForgotPasswordRequestForm: React.FC<ForgotPasswordRequestFormProps> = ({
  onSubmit,
  isLoading,
  error,
  onClearError,
  onBackToLogin,
}) => (
  <AuthFormCard
    title="Reset your password"
    subtitle="Enter your email and we'll send you a verification code."
    error={error}
    onDismissError={onClearError}
  >
    <ComposableForm<ForgotPasswordRequestData>
      onSubmit={onSubmit}
      defaultValues={EMPTY_VALUES}
      className="space-y-4"
    >
      <ForgotPasswordRequestFormFields isLoading={isLoading} />
    </ComposableForm>

    <div className="flex justify-center -mt-2">
      <Button variant="link" size="sm" onClick={onBackToLogin} type="button" disabled={isLoading}>
        Back to sign in
      </Button>
    </div>
  </AuthFormCard>
);
