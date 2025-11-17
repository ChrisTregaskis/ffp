import { Button } from '@web/components/button/Button';
import { Title, Text } from '@web/components/text';
import { useAuth } from '@web/contexts/AuthContext';

/**
 * Home/Dashboard page component (placeholder).
 *
 * This is a protected route that requires authentication.
 * Displays basic user information from the authenticated session.
 *
 * Future implementation will include:
 * - Dashboard widgets
 * - Recent activity
 * - Quick actions
 * - Navigation to assessments and programmes
 */
export const HomePage = (): JSX.Element => {
  const { user, logout } = useAuth();

  const handleLogout = (): void => {
    void logout();
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <Title as="h1" colour="foreground">
            Dashboard
          </Title>
          <Button variant="destructive" onClick={handleLogout}>
            Sign out
          </Button>
        </div>

        <div className="space-y-6">
          {/* User info card */}
          <div className="rounded-lg bg-white p-6 shadow">
            <Title as="h2" colour="foreground" className="mb-4">
              Welcome back!
            </Title>
            {user && (
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Text
                    as="span"
                    styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}
                  >
                    Email
                  </Text>
                  <Text as="p" styleProps={{ size: 'sm', colour: 'foreground' }} className="mt-1">
                    {user.email}
                  </Text>
                </div>
                <div>
                  <Text
                    as="span"
                    styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}
                  >
                    Role
                  </Text>
                  <Text as="p" styleProps={{ size: 'sm', colour: 'foreground' }} className="mt-1">
                    {user.role}
                  </Text>
                </div>
                <div>
                  <Text
                    as="span"
                    styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}
                  >
                    Tenant ID
                  </Text>
                  <Text
                    as="p"
                    styleProps={{ size: 'sm', colour: 'foreground' }}
                    className="mt-1 font-mono"
                  >
                    {user.tenantId}
                  </Text>
                </div>
                <div>
                  <Text
                    as="span"
                    styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}
                  >
                    User ID
                  </Text>
                  <Text
                    as="p"
                    styleProps={{ size: 'sm', colour: 'foreground' }}
                    className="mt-1 font-mono"
                  >
                    {user.userId}
                  </Text>
                </div>
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
