import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button/Button';
import { Card } from '@web/components/Card/Card';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { AuthLayout } from '@web/components/layout/AuthLayout';

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
    void navigate('/login');
  };

  return (
    <AuthLayout title="Forgot your password?" subtitle="Password reset functionality coming soon">
      <Card>
        <div className="space-y-6 text-center">
          {/* Info icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-blue-100 p-3">
              <Icon
                name={Icons.HELPCIRCLE}
                styleProps={{ size: 'xl', colour: 'var(--color-primary)' }}
              />
            </div>
          </div>

          {/* Placeholder message */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Password reset functionality is not yet implemented.
            </p>
            <p className="text-sm text-gray-600">
              This feature will be added in a future update and will allow you to reset your
              password via email verification.
            </p>
          </div>

          {/* Contact info */}
          <div className="rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-700">
              If you need to reset your password, please contact your system administrator.
            </p>
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
