import { Title, Text } from '@web/components/text';

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
    <div className="flex min-h-screen bg-muted">
      {/* Sidebar navigation (placeholder) */}
      <aside className="w-64 bg-white shadow-md">
        <div className="flex h-full flex-col">
          {/* App branding */}
          <div className="border-b border-border p-6">
            <Title as="h1" colour="foreground">
              Fit For Purpose
            </Title>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <a href="/" className="block rounded-md bg-primary/10 px-4 py-2">
                <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'primary' }}>
                  Dashboard
                </Text>
              </a>
            </div>
          </nav>

          {/* Footer placeholder */}
          <div className="border-t border-border p-4">
            <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
              FFP v0.1.0 (Sprint 1)
            </Text>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1">{children}</main>
    </div>
  );
};
