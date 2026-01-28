import {
  ComponentCategoriesGrid,
  ComponentPageWrapper,
  DeveloperInstructions,
} from '@web/components/dev';
import { Text, Title } from '@web/components/text';

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
export const ComponentsPage = (): JSX.Element => {
  return (
    <ComponentPageWrapper maxWidth="7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 inline-block rounded-md bg-warning/10 px-3 py-1">
          <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'warning' }}>
            Development Only
          </Text>
        </div>
        <Title as="h1" className="mb-2">
          Component Showcase
        </Title>
        <Text as="p" styleProps={{ size: 'lg', colour: 'muted-foreground' }}>
          Interactive demonstrations of all UI components used in Fit For Purpose
        </Text>
      </div>

      {/* Component categories grid */}
      <ComponentCategoriesGrid categories={componentCategories} />

      {/* Developer instructions */}
      <div className="mt-8 space-y-4">
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

        <DeveloperInstructions title="Demo-Only Components">
          <div className="space-y-3">
            <Text as="p" styleProps={{ size: 'sm' }}>
              Components in <code className="rounded bg-muted px-1">components/demo/</code> are for
              dev demo pages only. NOT for production use.
            </Text>
            <Text as="p" styleProps={{ size: 'sm', weight: 'medium' }}>
              DemoTabs - Use when displaying different versions of a component:
            </Text>
            <code className="block whitespace-pre rounded bg-muted p-2 text-xs">
              {`import { DemoTabs } from '@web/components/demo';

<DemoTabs
  tabs={[
    { id: 'basic', label: 'Basic', content: <BasicDemo /> },
    { id: 'error', label: 'Error', content: <ErrorDemo /> },
    { id: 'disabled', label: 'Disabled', content: <DisabledDemo /> },
  ]}
/>`}
            </code>
          </div>
        </DeveloperInstructions>
      </div>
    </ComponentPageWrapper>
  );
};
