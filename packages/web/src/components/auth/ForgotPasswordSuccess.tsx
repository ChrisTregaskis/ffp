import { Button, Icons } from '@web/components/atoms';
import { Card, StatusResult } from '@web/components/molecules';

export interface ForgotPasswordSuccessProps {
  /** Navigate back to sign in */
  onBackToLogin: () => void;
}

/**
 * Forgot password success — step 3 of the reset flow.
 *
 * Confirmation message after the password has been successfully reset.
 */
export const ForgotPasswordSuccess: React.FC<ForgotPasswordSuccessProps> = ({ onBackToLogin }) => {
  return (
    <Card>
      <StatusResult
        icon={Icons.CHECKCIRCLE}
        iconVariant="success"
        title="Password reset successfully"
        description="Your password has been updated. You can now sign in with your new password."
        spacing="compact"
        actions={
          <Button variant="primary" fullWidth onClick={onBackToLogin}>
            Back to sign in
          </Button>
        }
      />
    </Card>
  );
};
