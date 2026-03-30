import { forgotPasswordRequestFields, type ForgotPasswordRequestData } from '@web/components/auth';
import { Button } from '@web/components/button/Button';
import { Card } from '@web/components/Card/Card';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { Form } from '@web/components/form';

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
}) => {
  return (
    <Card
      title="Reset your password"
      subtitle="Enter your email and we'll send you a verification code."
      centerHeader
    >
      {error && (
        <StaticAlert variant="error" message={error} onDismiss={onClearError} className="mb-6" />
      )}

      <div className="space-y-6">
        <Form
          fields={forgotPasswordRequestFields}
          onSubmit={onSubmit}
          submitLabel={isLoading ? 'Sending code...' : 'Send verification code'}
          isSubmitting={isLoading}
        />

        <div className="flex justify-center -mt-2">
          <Button
            variant="link"
            size="sm"
            onClick={onBackToLogin}
            type="button"
            disabled={isLoading}
          >
            Back to sign in
          </Button>
        </div>
      </div>
    </Card>
  );
};
