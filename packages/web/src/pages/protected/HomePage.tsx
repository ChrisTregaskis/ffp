import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { PageContainer, PageHeader } from '@web/components/layout';
import { LoadingSpinner } from '@web/components/LoadingSpinner/LoadingSpinner';
import { Title, Text } from '@web/components/text';
import { USER_ROLE } from '@web/constants/roles';
import { shouldRedirectToAssessment, useUserAssessmentStatusQuery } from '@web/hooks/assessments';
import { useAuth } from '@web/hooks/useAuth';
import { RouteKey, routes } from '@web/pages/routes';

/**
 * Home/Dashboard page component.
 *
 * This is a protected route that requires authentication.
 * Handles role-based redirects:
 * - Programme users (programme_user): Shows this dashboard
 * - Customer admins (customer_owner, customer_admin): Redirects to /dashboard
 * - System admins (system_admin): Redirects to /admin/organisations
 *
 * Displays basic user information from the authenticated session.
 *
 * Future implementation will include:
 * - Dashboard widgets
 * - Recent activity
 * - Quick actions
 * - Navigation to assessments and programmes
 */
export const HomePage = (): JSX.Element => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isProgrammeUser = user?.role === USER_ROLE.PROGRAMME_USER;
  const { data: assessmentStatus, isLoading: isStatusLoading } = useUserAssessmentStatusQuery({
    enabled: isProgrammeUser,
  });

  // Whether a redirect is pending (used to suppress layout flash)
  const isRedirecting =
    user?.role === USER_ROLE.CUSTOMER_OWNER ||
    user?.role === USER_ROLE.CUSTOMER_ADMIN ||
    user?.role === USER_ROLE.SYSTEM_ADMIN ||
    (isProgrammeUser && assessmentStatus && shouldRedirectToAssessment(assessmentStatus));

  // Redirect users to their role-appropriate home page
  useEffect(() => {
    if (!user) {
      return;
    }

    // Location admins/owners should go to the location dashboard
    if (user.role === USER_ROLE.CUSTOMER_OWNER || user.role === USER_ROLE.CUSTOMER_ADMIN) {
      void navigate(routes[RouteKey.CUSTOMER_DASHBOARD].path, { replace: true });

      return;
    }

    // System admins should go to the admin organisations page
    if (user.role === USER_ROLE.SYSTEM_ADMIN) {
      void navigate(routes[RouteKey.ADMIN_ORGANISATIONS].path, { replace: true });

      return;
    }

    // Programme users who have never had a programme → redirect to assessment
    // Users who previously had a programme (completed/archived) land on the dashboard
    // and can optionally start a new assessment from the Progress page.
    if (isProgrammeUser && assessmentStatus && shouldRedirectToAssessment(assessmentStatus)) {
      const assessmentPath = routes[RouteKey.ASSESSMENT].path;

      void navigate(`${assessmentPath}?flowId=${assessmentStatus.assessmentFlowId}`, {
        replace: true,
      });
    }
  }, [user, navigate, isProgrammeUser, assessmentStatus]);

  // Show full-screen overlay spinner while loading status or redirecting.
  // Uses fixed positioning to cover the entire viewport including the sidebar.
  if ((isProgrammeUser && isStatusLoading) || isRedirecting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" variant="center" />
      </div>
    );
  }

  return (
    <PageContainer centred>
      <PageHeader title="Dashboard" />

      <div className="max-w-4xl space-y-6">
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
                  Organisation ID
                </Text>
                <Text
                  as="p"
                  styleProps={{ size: 'sm', colour: 'foreground' }}
                  className="mt-1 font-mono"
                >
                  {user.organisationId}
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
    </PageContainer>
  );
};
