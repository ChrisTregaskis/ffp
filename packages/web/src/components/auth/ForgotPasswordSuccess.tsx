import { Button, Icon, Icons, Text } from '@web/components/atoms';
import { Card } from '@web/components/molecules';

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
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-success/10 p-3">
            <Icon
              name={Icons.CHECKCIRCLE}
              styleProps={{ size: 'xl', colour: 'var(--color-success)' }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Text as="p" styleProps={{ size: 'lg', weight: 'semibold', colour: 'foreground' }}>
            Password reset successfully
          </Text>
          <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
            Your password has been updated. You can now sign in with your new password.
          </Text>
        </div>

        <Button variant="primary" fullWidth onClick={onBackToLogin}>
          Back to sign in
        </Button>
      </div>
    </Card>
  );
};
