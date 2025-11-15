import {
  ComponentPageWrapper,
  ComponentPageHeader,
  ComponentSection,
  DeveloperInstructions,
  IconSizeDisplay,
} from '@web/components/dev';
import { Icon, Icons } from '@web/components/Icon';

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
export function IconComponentsPage(): JSX.Element {
  // Get all icon names from enum
  const iconNames = Object.values(Icons);

  return (
    <ComponentPageWrapper maxWidth="6xl">
      <ComponentPageHeader
        title="Icon Components"
        description="Complete icon library with size and colour variations"
        showBackLink
      />

      {/* Size variations */}
      <ComponentSection title="Size Variations">
        {iconNames.length > 0 ? (
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
        ) : (
          <p className="text-sm text-gray-500">
            No icons available. Run{' '}
            <code className="rounded bg-gray-100 px-1">pnpm icon:generate</code>
          </p>
        )}
      </ComponentSection>

      {/* Colour variations */}
      <ComponentSection title="Colour Variations (FFP Brand Colours)">
        {iconNames.length > 0 ? (
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
        ) : (
          <p className="text-sm text-gray-500">
            No icons available. Run{' '}
            <code className="rounded bg-gray-100 px-1">pnpm icon:generate</code>
          </p>
        )}
      </ComponentSection>

      {/* All icons grid */}
      <ComponentSection
        title={
          <>
            Complete Icon Library
            <span className="ml-2 text-base font-normal text-gray-500">
              ({iconNames.length} total)
            </span>
          </>
        }
        className="mb-8"
      >
        {iconNames.length > 0 ? (
          <div className="grid grid-cols-6 gap-4 md:grid-cols-8 lg:grid-cols-10">
            {iconNames.map((name) => (
              <div
                key={name}
                className="flex flex-col items-center rounded p-3 transition-colours hover:bg-gray-50"
                title={name}
              >
                <Icon name={name} styleProps={{ size: 'lg' }} />
                <span className="mt-2 break-all text-center text-xs text-gray-600">{name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
            <p className="mb-2 text-sm font-medium text-yellow-800">No Icons Found</p>
            <p className="text-sm text-yellow-700">
              Add Icomoon assets to{' '}
              <code className="rounded bg-yellow-100 px-1">src/assets/icomoon/</code> and run{' '}
              <code className="rounded bg-yellow-100 px-1">pnpm icon:generate</code> to populate
              icons.
            </p>
          </div>
        )}
      </ComponentSection>

      {/* Developer instructions */}
      <DeveloperInstructions title="Usage Instructions">
        <div className="space-y-3">
          <div>
            <p className="mb-1 font-medium">Import the Icon component:</p>
            <code className="block rounded bg-muted p-2 text-xs">
              {`import { Icon, Icons } from '@web/components/Icon';`}
            </code>
          </div>
          <div>
            <p className="mb-1 font-medium">Use in your component:</p>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Icon name={Icons.ARROW_RIGHT} styleProps={{ size: 'md', colour: 'blue' }} />`}
            </code>
          </div>
          <div>
            <p className="mb-1 font-medium">Add new icons:</p>
            <ol className="ml-4 list-decimal space-y-1 text-xs">
              <li>Upload SVG to Icomoon.io</li>
              <li>Download icon font and selection.json</li>
              <li>Replace files in src/assets/icomoon/</li>
              <li>
                Run <code className="rounded bg-muted px-1">pnpm icon:generate</code>
              </li>
            </ol>
          </div>
        </div>
      </DeveloperInstructions>
    </ComponentPageWrapper>
  );
}
