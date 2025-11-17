import { Title, Text } from '@web/components/text';

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
          <a
            href="/"
            className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'foreground' }}>
              Go to Dashboard
            </Text>
          </a>
        </div>
      </div>
    </div>
  );
};
