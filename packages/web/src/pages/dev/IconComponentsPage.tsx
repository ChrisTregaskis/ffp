import { DemoTabs, type DemoTab } from '@web/components/demo';
import {
  ComponentPageWrapper,
  ComponentPageHeader,
  ComponentSection,
  DeveloperInstructions,
  IconSizeDisplay,
} from '@web/components/dev';
import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

/**
 * Icon components showcase page (development only).
 *
 * Demonstrates all icon components and their features:
 * - Size variations (xs, sm, md, lg, xl)
 * - Colour variations (FFP brand colours)
 * - Complete icon library grid
 *
 * Icons are generated from Icomoon assets using:
 * ```bash
 * pnpm icon:generate
 * ```
 *
 * This processes the selection.json file and creates TypeScript types.
 */
export const IconComponentsPage = (): JSX.Element => {
  const componentTabs: DemoTab[] = [
    { id: 'sizes', label: 'Sizes', content: <SizesDemo /> },
    { id: 'colours', label: 'Colours', content: <ColoursDemo /> },
    { id: 'library', label: 'Icon Library', content: <IconLibraryDemo /> },
  ];

  return (
    <ComponentPageWrapper maxWidth="6xl">
      <ComponentPageHeader
        title="Icon Components"
        description="Complete icon library with size and colour variations"
        showBackLink
      />

      <ComponentSection title="Component Demos">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Click through each tab to explore icon sizes, FFP brand colours, and the full icon
          library.
        </Text>
        <DemoTabs tabs={componentTabs} />
      </ComponentSection>

      {/* Developer instructions */}
      <DeveloperInstructions title="Usage Instructions">
        <div className="space-y-3">
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Import the Icon component:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`import { Icon, Icons } from '@web/components/Icon';`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Use in FFP component:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Icon name={Icons.ARROW_RIGHT} styleProps={{ size: 'md', colour: 'blue' }} />`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Add new icons:
            </Text>
            <ol className="ml-4 list-decimal space-y-1">
              <li>
                <Text styleProps={{ size: 'xs' }}>Upload SVG to Icomoon.io</Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>Download icon font and selection.json</Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>Replace files in src/assets/icomoon/</Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  Run <code className="rounded bg-muted px-1">pnpm icon:generate</code>
                </Text>
              </li>
            </ol>
          </div>
        </div>
      </DeveloperInstructions>
    </ComponentPageWrapper>
  );
};

// ============================================================================
// Sizes Demo
// ============================================================================

const SizesDemo: React.FC = () => {
  const iconNames = Object.values(Icons);

  if (iconNames.length === 0) {
    return (
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        No icons available. Run <code className="rounded bg-muted px-1">pnpm icon:generate</code>
      </Text>
    );
  }

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Five size options from extra small (12px) to extra large (32px).
      </Text>
      <div className="flex items-center gap-8">
        <IconSizeDisplay
          icon={<Icon name={iconNames[0]} styleProps={{ size: 'xs' }} />}
          label="xs (12px)"
        />
        <IconSizeDisplay
          icon={<Icon name={iconNames[0]} styleProps={{ size: 'sm' }} />}
          label="sm (16px)"
        />
        <IconSizeDisplay
          icon={<Icon name={iconNames[0]} styleProps={{ size: 'md' }} />}
          label="md (20px)"
        />
        <IconSizeDisplay
          icon={<Icon name={iconNames[0]} styleProps={{ size: 'lg' }} />}
          label="lg (24px)"
        />
        <IconSizeDisplay
          icon={<Icon name={iconNames[0]} styleProps={{ size: 'xl' }} />}
          label="xl (32px)"
        />
      </div>
    </div>
  );
};

// ============================================================================
// Colours Demo
// ============================================================================

const ColoursDemo: React.FC = () => {
  const iconNames = Object.values(Icons);

  if (iconNames.length === 0) {
    return (
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        No icons available. Run <code className="rounded bg-muted px-1">pnpm icon:generate</code>
      </Text>
    );
  }

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        FFP brand colours applied via the colour style prop.
      </Text>
      <div className="flex items-center gap-8">
        <IconSizeDisplay
          icon={
            <Icon
              name={iconNames[0]}
              styleProps={{ size: 'lg', colour: 'var(--color-ffp-primary-blue)' }}
            />
          }
          label="Primary Blue"
        />
        <IconSizeDisplay
          icon={
            <Icon
              name={iconNames[0]}
              styleProps={{ size: 'lg', colour: 'var(--color-ffp-dark-blue)' }}
            />
          }
          label="Dark Blue"
        />
        <IconSizeDisplay
          icon={
            <Icon
              name={iconNames[0]}
              styleProps={{ size: 'lg', colour: 'var(--color-ffp-green)' }}
            />
          }
          label="Green"
        />
        <IconSizeDisplay
          icon={
            <Icon
              name={iconNames[0]}
              styleProps={{ size: 'lg', colour: 'var(--color-ffp-light-purple)' }}
            />
          }
          label="Light Purple"
        />
      </div>
    </div>
  );
};

// ============================================================================
// Icon Library Demo
// ============================================================================

const IconLibraryDemo: React.FC = () => {
  const iconNames = Object.values(Icons);

  if (iconNames.length === 0) {
    return (
      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
        <Text as="p" className="mb-2 text-yellow-800" styleProps={{ size: 'sm', weight: 'medium' }}>
          No Icons Found
        </Text>
        <Text as="p" className="text-yellow-700" styleProps={{ size: 'sm' }}>
          Add Icomoon assets to{' '}
          <code className="rounded bg-yellow-100 px-1">src/assets/icomoon/</code> and run{' '}
          <code className="rounded bg-yellow-100 px-1">pnpm icon:generate</code> to populate icons.
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        All {iconNames.length} icons in the library. Hover for the icon name.
      </Text>
      <div className="grid grid-cols-6 gap-4 md:grid-cols-8 lg:grid-cols-10">
        {iconNames.map((name) => (
          <div
            key={name}
            className="flex flex-col items-center rounded p-3 transition-colours hover:bg-gray-50"
            title={name}
          >
            <Icon name={name} styleProps={{ size: 'lg' }} />
            <Text className="mt-2 break-all text-center text-gray-600" styleProps={{ size: 'xs' }}>
              {name}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};
