import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button/Button';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';
import { useAuth } from '@web/hooks/useAuth';
import { getRoleHomePath } from '@web/lib/rbac';
import { RouteKey, routes } from '@web/pages/routes';

/**
 * Unauthorised access page component
 *
 * Displayed when a user attempts to access a route they don't have permission for.
 * Shows a user-friendly message explaining the access denial and provides a button
 * to navigate to their role-appropriate home page.
 */
export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = (): void => {
    if (!user) {
      // Fallback: navigate to login if user is somehow not authenticated
      void navigate(routes[RouteKey.LOGIN].path);
      return;
    }

    // Navigate to role-specific home page
    const homeRouteKey = getRoleHomePath(user.role);
    void navigate(routes[homeRouteKey].path);
  };

  return (
    <div className="flex min-h-full w-full items-center justify-center bg-muted px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {/* Unauthorised Icon */}
          <div className="mx-auto w-16">
            <Icon
              name={Icons.SHIELD}
              styleProps={{ size: 'xl', colour: 'var(--color-destructive)' }}
              ariaLabel="Access Denied"
            />
          </div>

          <div className="mt-6">
            <Title as="h5" colour="destructive">
              Access Denied
            </Title>
          </div>

          <div className="mt-2">
            <Text
              as="p"
              styleProps={{ size: 'sm', colour: 'muted-foreground' }}
              className="text-center"
            >
              {`You don't have permission to view this page.`}
            </Text>
          </div>

          <div className="mt-4">
            <Text
              as="p"
              styleProps={{ size: 'xs', colour: 'muted-foreground' }}
              className="text-center"
            >
              If you believe this is an error, please contact support for assistance.
            </Text>
          </div>
        </div>

        <div className="mt-8">
          <Button onClick={handleGoHome} variant="primary" size="md" fullWidth>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
};
