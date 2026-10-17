import { Button, Icons } from '@web/components/atoms';
import { Card, StatusResult } from '@web/components/molecules';

export interface SignInServiceUnavailableProps {
  /** Run the sign-in check again */
  onRetry: () => void;
}

/**
 * Sign-in service unavailable organism component.
 *
 * Shown in place of the sign-in redirect when the session could not be confirmed
 * because the sign-in service was unreachable. The stored session is kept, so a
 * retry restores it without signing in again.
 */
export const SignInServiceUnavailable: React.FC<SignInServiceUnavailableProps> = ({ onRetry }) => (
  <Card>
    <StatusResult
      icon={Icons.ALERTTRIANGLE}
      iconVariant="warning"
      title="Can't reach the sign-in service"
      description="We couldn't confirm your sign-in just now. Check your connection, then try again."
      actions={
        <Button variant="primary" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  </Card>
);
