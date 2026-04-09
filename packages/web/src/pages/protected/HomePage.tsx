import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { LoadingSpinner } from '@web/components/LoadingSpinner/LoadingSpinner';
import { USER_ROLE } from '@web/constants/roles';
import { shouldRedirectToAssessment, useUserAssessmentStatusQuery } from '@web/hooks/assessments';
import { useAuth } from '@web/hooks/useAuth';
import { DashboardPage } from '@web/pages/protected/programme-user/DashboardPage';
import { RouteKey, routes } from '@web/pages/routes';

/**
 * Home page — role-based entry point for authenticated users.
 *
 * - Programme users: renders DashboardPage (programme overview, next session, phase progress)
 * - Customer admins: redirects to /dashboard
 * - System admins: redirects to /admin/organisations
 * - Programme users without a programme: redirects to assessment flow
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

      void navigate(`${assessmentPath}?flowId=${String(assessmentStatus.assessmentFlowId)}`, {
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

  return <DashboardPage />;
};
