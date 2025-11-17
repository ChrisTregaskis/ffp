import type { PropsWithChildren } from 'react';

/**
 * Main application layout wrapper for protected routes.
 *
 * Provides consistent layout structure with sidebar navigation
 * for protected pages. Does not wrap public pages (e.g., login)
 * or fullscreen pages (e.g., assessments with `excludeLayout: true`).
 * TODO: Update to align with prototype designs
 * TODO: Utilise hook to dynamically generate routes available based on user role
 */
export const AppLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar navigation (placeholder) */}
      <aside className="w-64 bg-white shadow-md">
        <div className="flex h-full flex-col">
          {/* App branding */}
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-xl font-bold text-gray-900">Fit For Purpose</h1>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <a
                href="/"
                className="block rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
              >
                Dashboard
              </a>
            </div>
          </nav>

          {/* Footer placeholder */}
          <div className="border-t border-gray-200 p-4">
            <p className="text-xs text-gray-500">FFP v0.1.0 (Sprint 1)</p>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1">{children}</main>
    </div>
  );
};
