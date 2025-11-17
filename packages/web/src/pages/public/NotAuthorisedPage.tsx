import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button/Button';
import { Title, Text } from '@web/components/text';
import { routes, RouteKey } from '@web/pages/routes';

/**
 * 403 Not Authorised page.
 *
 * Displayed when a user attempts to access a route they don't have
 * permission to view. This can occur if:
 * - User's role doesn't have access to the resource
 * - User's session has expired
 * - User is accessing a tenant-specific resource from wrong tenant
 */
export const NotAuthorisedPage = (): JSX.Element => {
  const navigate = useNavigate();

  const handleGoToDashboard = (): void => {
    void navigate(routes[RouteKey.HOME].path);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="text-center">
        <Title as="h1" colour="foreground" className="text-9xl">
          403
        </Title>
        <Title as="h2" colour="muted-foreground" className="mt-4 uppercase tracking-wider">
          Not Authorised
        </Title>
        <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mt-4">
          You do not have permission to access this page.
        </Text>
        <div className="mt-8">
          <Button variant="primary" onClick={handleGoToDashboard}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
