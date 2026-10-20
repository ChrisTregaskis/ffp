import { Button, Icons, Text } from '@web/components/atoms';
import { StatusResult } from '@web/components/molecules';
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
      <div className="w-full max-w-md">
        <StatusResult
          icon={Icons.SHIELD}
          iconVariant="destructive"
          iconAppearance="plain"
          title="Access Denied"
          titleAs="h5"
          titleColour="destructive"
          description="You don't have permission to view this page."
          spacing="compact"
          actions={
            <Button onClick={handleGoHome} variant="primary" size="md" fullWidth>
              Go Home
            </Button>
          }
        >
          {/* mb-2 keeps the page's wider gap above the button */}
          <Text
            as="p"
            styleProps={{ size: 'xs', colour: 'muted-foreground' }}
            className="mt-4 mb-2 text-center"
          >
            If you believe this is an error, please contact support for assistance.
          </Text>
        </StatusResult>
      </div>
    </div>
  );
};
