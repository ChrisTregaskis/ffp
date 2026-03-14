import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button/Button';
import { StatusResult } from '@web/components/feedback/StatusResult';
import { Icons } from '@web/components/Icon/types';
import { useAuth } from '@web/hooks/useAuth';
import { getRoleHomePath } from '@web/lib/rbac';
import { RouteKey, routes } from '@web/pages/routes';

/**
 * Page not found (404) component
 *
 * Displayed when a user navigates to a URL that does not match any route.
 * Shows a user-friendly message and provides a button to navigate to
 * their role-appropriate home page.
 */
export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = (): void => {
    if (!user) {
      void navigate(routes[RouteKey.LOGIN].path);

      return;
    }

    const homeRouteKey = getRoleHomePath(user.role);
    void navigate(routes[homeRouteKey].path);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <StatusResult
          icon={Icons.SEARCH}
          iconColour="var(--color-muted-foreground)"
          iconBg="bg-muted-foreground/20"
          title="Page not found"
          description="The page you are looking for does not exist or has been moved."
          actions={
            <Button onClick={handleGoHome} variant="primary" size="md">
              Go Home
            </Button>
          }
        />
      </div>
    </div>
  );
};
