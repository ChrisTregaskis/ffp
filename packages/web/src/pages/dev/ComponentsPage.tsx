import {
  ComponentCategoriesGrid,
  ComponentPageWrapper,
  DeveloperInstructions,
} from '@web/components/dev';

import { componentCategories } from '.';

/**
 * Component showcase landing page (development only).
 *
 * Provides a centralized index of all component demonstrations.
 * Only accessible in non-production environments.
 *
 * This page serves as a development tool for:
 * - Testing components in isolation
 * - Visual regression testing
 * - Component documentation and examples
 * - Design system reference
 */
export function ComponentsPage(): JSX.Element {
  return (
    <ComponentPageWrapper maxWidth="7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 inline-block rounded-md bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
          Development Only
        </div>
        <h1 className="mb-2 text-4xl font-bold text-foreground">Component Showcase</h1>
        <p className="text-lg text-muted-foreground">
          Interactive demonstrations of all UI components used in Fit For Purpose
        </p>
      </div>

      {/* Component categories grid */}
      <ComponentCategoriesGrid categories={componentCategories} />

      {/* Developer instructions */}
      <div className="mt-8">
        <DeveloperInstructions title="Adding New Components">
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Add route key to <code className="rounded bg-muted px-1">RouteKey.ts</code>
            </li>
            <li>
              Create component demo page in{' '}
              <code className="rounded bg-muted px-1">pages/dev/</code>
            </li>
            <li>
              Add route config to <code className="rounded bg-muted px-1">routes/index.ts</code>{' '}
              (dev-only section)
            </li>
            <li>Update this landing page with the new category</li>
          </ol>
        </DeveloperInstructions>
      </div>
    </ComponentPageWrapper>
  );
}
