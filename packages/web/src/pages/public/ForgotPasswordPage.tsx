import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button/Button';
import { Card } from '@web/components/Card/Card';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { AuthLayout } from '@web/components/layout/AuthLayout';
import { Text } from '@web/components/text';
import { RouteKey, routes } from '@web/pages/routes';

/**
 * Forgot Password page component (placeholder).
 *
 * This is a placeholder page that will be implemented with full
 * password reset functionality in a future ticket.
 *
 * Current behaviour:
 * - Displays informative message about future implementation
 * - Provides link back to login page
 * - Uses consistent AuthLayout styling
 *
 * Future implementation will include:
 * - Email input for password reset request
 * - Cognito password reset flow
 * - Verification code entry
 * - New password form
 */
export const ForgotPasswordPage = (): JSX.Element => {
  const navigate = useNavigate();

  const handleBackToLogin = (): void => {
    void navigate(routes[RouteKey.LOGIN].path);
  };

  return (
    <AuthLayout title="Forgot your password?">
      <Card>
        <div className="space-y-6 text-center">
          {/* Info icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Icon
                name={Icons.HELPCIRCLE}
                styleProps={{ size: 'xl', colour: 'var(--color-primary)' }}
              />
            </div>
          </div>

          {/* Placeholder message */}
          <div className="space-y-2">
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
              Password reset functionality is not yet implemented.
            </Text>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
              This feature will be added in a future update and will allow you to reset your
              password via email verification.
            </Text>
          </div>

          {/* Contact info */}
          <div className="rounded-md bg-info/10 p-4">
            <Text as="p" styleProps={{ size: 'sm', colour: 'info' }}>
              If you need to reset your password, please contact your system administrator.
            </Text>
          </div>

          {/* Back to login button */}
          <Button variant="primary" fullWidth onClick={handleBackToLogin}>
            Back to sign in
          </Button>
        </div>
      </Card>
    </AuthLayout>
  );
};
