import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { SignInServiceUnavailable } from '@web/components/auth/SignInServiceUnavailable';
import { LoadingState } from '@web/components/molecules';
import { AppLayout, AuthLayout } from '@web/components/templates';
import { useAuth } from '@web/hooks/useAuth';
import { hasRole, logUnauthorisedAccess } from '@web/lib/rbac';

import { matchRoute } from './matchRoute';

import { RouteKey, routes } from '.';

import type { PropsWithChildren } from 'react';

interface ProtectedRouteProps extends PropsWithChildren {
  // If true, exclude AppLayout wrapper (for fullscreen pages like assessments)
  excludeLayout?: boolean;
}

/**
 * Protected route wrapper component.
 *
 * Ensures user is authenticated and authorised before rendering protected pages.
 * Handles the following scenarios:
 * - User is loading: Shows loading spinner
 * - Sign-in service unreachable: Shows a retry state instead of signing the user out
 * - User is not authenticated: Redirects to login page
 * - User lacks required role: Redirects to unauthorised page
 * - User is authenticated and authorised: Renders page content (with or without AppLayout)
 *
 * Role-based access control (RBAC):
 * - Checks if the current route has allowedRoles defined
 * - If allowedRoles exists, validates user's role against the list
 * - Logs unauthorised access attempts for security monitoring
 */
export const ProtectedRoute = ({
  children,
  excludeLayout = false,
}: ProtectedRouteProps): JSX.Element => {
  const { user, loading, authUnavailable, checkAuth } = useAuth();
  const location = useLocation();

  // Matched by pattern: a parameterised path never equals a real pathname, so string
  // equality leaves allowedRoles and the denial logging inert on any route with a param.
  const currentRoute = matchRoute(location.pathname)?.route;

  const userHasAccess =
    !currentRoute?.allowedRoles ||
    currentRoute.allowedRoles.length === 0 ||
    (user ? hasRole(user.role, currentRoute.allowedRoles) : false);

  // Log unauthorised access attempts (TODO: Add sentry or something for security observation?)
  useEffect(() => {
    const hasAllowedRoles = currentRoute?.allowedRoles && currentRoute.allowedRoles.length > 0;

    if (user && !userHasAccess && hasAllowedRoles) {
      logUnauthorisedAccess(user.userId, location.pathname, user.role);
    }
  }, [user, userHasAccess, currentRoute, location.pathname]);

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingState layout="screen" />;
  }

  if (authUnavailable) {
    return (
      <AuthLayout>
        <SignInServiceUnavailable onRetry={() => void checkAuth()} />
      </AuthLayout>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={routes[RouteKey.LOGIN].path} replace />;
  }

  // Redirect to unauthorised page if user lacks required role
  if (!userHasAccess) {
    return <Navigate to={routes[RouteKey.UNAUTHORIZED].path} replace />;
  }

  // Render page content
  const content = children ?? <Outlet />;

  // Wrap in AppLayout unless explicitly excluded
  if (excludeLayout) {
    return <>{content}</>;
  }

  return <AppLayout>{content}</AppLayout>;
};
