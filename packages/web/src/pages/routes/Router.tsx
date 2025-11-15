import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
} from 'react-router-dom';

import { ProtectedRoute } from './ProtectedRoute';

import { RouteKey, routes } from '.';

/**
 * Main application router component.
 *
 * Configures all application routes using React Router v6.
 * Routes are defined in the centralized routes config and automatically
 * split into public and protected routes.
 *
 * Route Structure:
 * - Public routes: Render directly (e.g., /login)
 * - Protected routes: Wrapped in ProtectedRoute for auth checks
 * - Dev-only routes: Excluded in production builds
 * - Catch-all: Redirects to home (will redirect to login if not authed)
 *
 * Protected routes are automatically wrapped with:
 * - Authentication check (redirects to /login if not authenticated)
 * - AppLayout (unless route has excludeLayout: true)
 *
 * @example
 * ```tsx
 * // In App.tsx
 * <AuthProvider>
 *   <Router />
 * </AuthProvider>
 * ```
 */
export function Router(): JSX.Element {
  const isProduction = import.meta.env.PROD;

  // Filter out dev-only routes in production
  const availableRoutes = Object.entries(routes).filter(
    ([, config]) => !config.devOnly || !isProduction
  );

  // Separate public and protected routes from available routes
  const publicRoutes = availableRoutes.filter(([, config]) => config.public);
  const protectedRoutes = availableRoutes.filter(([, config]) => !config.public);

  // Create router configuration
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* Public routes (no auth required) */}
        {publicRoutes.map(([key, config]) => {
          const PageComponent = config.pageComponent;

          return <Route key={key} path={config.path} element={<PageComponent />} />;
        })}

        {/* Protected routes (auth required) */}
        <Route element={<ProtectedRoute />}>
          {protectedRoutes.map(([key, config]) => {
            const PageComponent = config.pageComponent;

            return (
              <Route
                key={key}
                path={config.path}
                element={
                  config.excludeLayout ? (
                    <ProtectedRoute excludeLayout>
                      <PageComponent />
                    </ProtectedRoute>
                  ) : (
                    <PageComponent />
                  )
                }
              />
            );
          })}
        </Route>

        {/* Catch-all: redirect to home (which will redirect to login if not authed) */}
        <Route path="*" element={<Navigate to={routes[RouteKey.HOME].path} replace />} />
      </>
    )
  );

  return <RouterProvider router={router} />;
}
