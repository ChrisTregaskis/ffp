import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';

import { NotFoundPage } from '@web/pages/NotFoundPage';

import { ProtectedRoute } from './ProtectedRoute';

import { routes } from '.';

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
 * - Catch-all: Shows a 404 "Page not found" page
 *
 * Protected routes are automatically wrapped with:
 * - Authentication check (redirects to /login if not authenticated)
 * - AppLayout (unless route has excludeLayout: true)
 *
 */
export const Router = (): JSX.Element => {
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

        {/* Protected routes with AppLayout (auth required) */}
        <Route element={<ProtectedRoute />}>
          {protectedRoutes
            .filter(([, config]) => !config.excludeLayout)
            .map(([key, config]) => {
              const PageComponent = config.pageComponent;

              return <Route key={key} path={config.path} element={<PageComponent />} />;
            })}
        </Route>

        {/* Protected routes without AppLayout (fullscreen pages like assessments) */}
        {protectedRoutes
          .filter(([, config]) => config.excludeLayout)
          .map(([key, config]) => {
            const PageComponent = config.pageComponent;

            return (
              <Route
                key={key}
                path={config.path}
                element={
                  <ProtectedRoute excludeLayout>
                    <PageComponent />
                  </ProtectedRoute>
                }
              />
            );
          })}

        {/* Catch-all: show 404 page for unmatched routes */}
        <Route path="*" element={<NotFoundPage />} />
      </>
    )
  );

  return <RouterProvider router={router} />;
};
