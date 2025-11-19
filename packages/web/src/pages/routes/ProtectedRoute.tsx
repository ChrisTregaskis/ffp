import { Navigate, Outlet } from 'react-router-dom';

import { AppLayout } from '@web/components/layout/AppLayout';
import { useAuth } from '@web/contexts/AuthContext';

import { RouteKey, routes } from '.';

import type { PropsWithChildren } from 'react';

/**
 * Props for ProtectedRoute component.
 */
interface ProtectedRouteProps extends PropsWithChildren {
  /** If true, exclude AppLayout wrapper (for fullscreen pages like assessments) */
  excludeLayout?: boolean;
}

/**
 * Protected route wrapper component.
 *
 * Ensures user is authenticated before rendering protected pages.
 * Handles the following scenarios:
 * - User is authenticated: Renders page content (with or without AppLayout)
 * - User is loading: Shows loading spinner
 * - User is not authenticated: Redirects to login page
 *
 * This component wraps all protected routes and provides:
 * - Authentication check via useAuth hook
 * - Automatic redirect to login for unauthenticated users
 * - Optional AppLayout wrapper (can be excluded for fullscreen pages)
 * - Loading state during auth check
 *
 * @example
 * ```tsx
 * // With layout (default)
 * <ProtectedRoute>
 *   <HomePage />
 * </ProtectedRoute>
 *
 * // Without layout (fullscreen assessment)
 * <ProtectedRoute excludeLayout>
 *   <AssessmentPage />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute = ({
  children,
  excludeLayout = false,
}: ProtectedRouteProps): JSX.Element => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={routes[RouteKey.LOGIN].path} replace />;
  }

  // Render page content
  const content = children ?? <Outlet />;

  // Wrap in AppLayout unless explicitly excluded
  if (excludeLayout) {
    return <>{content}</>;
  }

  return <AppLayout>{content}</AppLayout>;
};
