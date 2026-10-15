import { Button, Icon, Icons, Text, Title } from '@web/components/atoms';
import { useGoHome } from '@web/hooks/useGoHome';

/**
 * Unauthorised access page component
 *
 * Displayed when a user attempts to access a route they don't have permission for.
 * Shows a user-friendly message explaining the access denial and provides a button
 * to navigate to their role-appropriate home page.
 */
export const UnauthorizedPage: React.FC = () => {
  const handleGoHome = useGoHome();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted px-4 py-12 sm:px-6 lg:px-8">
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
