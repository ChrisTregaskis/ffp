import { Link } from 'react-router-dom';

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/components"
            className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
          >
            ← Back to Components
          </Link>
          <div className="mb-4 inline-block rounded-md bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
            Development Only
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Icon Components</h1>
          <p className="text-gray-600">Complete icon library with size and colour variations</p>
        </div>

        {/* Size variations */}
        <section className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Size Variations</h2>
          {iconNames.length > 0 ? (
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center">
                <Icon name={iconNames[0]} styleProps={{ size: 'xs' }} />
                <span className="mt-2 text-xs text-gray-600">xs (12px)</span>
              </div>
              <div className="flex flex-col items-center">
                <Icon name={iconNames[0]} styleProps={{ size: 'sm' }} />
                <span className="mt-2 text-xs text-gray-600">sm (16px)</span>
              </div>
              <div className="flex flex-col items-center">
                <Icon name={iconNames[0]} styleProps={{ size: 'md' }} />
                <span className="mt-2 text-xs text-gray-600">md (20px)</span>
              </div>
              <div className="flex flex-col items-center">
                <Icon name={iconNames[0]} styleProps={{ size: 'lg' }} />
                <span className="mt-2 text-xs text-gray-600">lg (24px)</span>
              </div>
              <div className="flex flex-col items-center">
                <Icon name={iconNames[0]} styleProps={{ size: 'xl' }} />
                <span className="mt-2 text-xs text-gray-600">xl (32px)</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No icons available. Run{' '}
              <code className="rounded bg-gray-100 px-1">pnpm icon:generate</code>
            </p>
          )}
        </section>

        {/* Colour variations */}
        <section className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Colour Variations (FFP Brand Colours)
          </h2>
          {iconNames.length > 0 ? (
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center">
                <Icon
                  name={iconNames[0]}
                  styleProps={{ size: 'lg', colour: 'var(--color-ffp-primary-blue)' }}
                />
                <span className="mt-2 text-xs text-gray-600">Primary Blue</span>
              </div>
              <div className="flex flex-col items-center">
                <Icon
                  name={iconNames[0]}
                  styleProps={{ size: 'lg', colour: 'var(--color-ffp-dark-blue)' }}
                />
                <span className="mt-2 text-xs text-gray-600">Dark Blue</span>
              </div>
              <div className="flex flex-col items-center">
                <Icon
                  name={iconNames[0]}
                  styleProps={{ size: 'lg', colour: 'var(--color-ffp-green)' }}
                />
                <span className="mt-2 text-xs text-gray-600">Green</span>
              </div>
              <div className="flex flex-col items-center">
                <Icon
                  name={iconNames[0]}
                  styleProps={{ size: 'lg', colour: 'var(--color-ffp-light-purple)' }}
                />
                <span className="mt-2 text-xs text-gray-600">Light Purple</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No icons available. Run{' '}
              <code className="rounded bg-gray-100 px-1">pnpm icon:generate</code>
            </p>
          )}
        </section>

        {/* All icons grid */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Complete Icon Library
            <span className="ml-2 text-base font-normal text-gray-500">
              ({iconNames.length} total)
            </span>
          </h2>

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
        </section>

        {/* Usage instructions */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="mb-3 text-sm font-semibold text-blue-900">Usage Instructions</h3>
          <div className="space-y-3 text-sm text-blue-700">
            <div>
              <p className="mb-1 font-medium">Import the Icon component:</p>
              <code className="block rounded bg-blue-100 p-2 text-xs">
                {`import { Icon, Icons } from '@web/components/Icon';`}
              </code>
            </div>
            <div>
              <p className="mb-1 font-medium">Use in your component:</p>
              <code className="block rounded bg-blue-100 p-2 text-xs">
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
                  Run <code className="rounded bg-blue-100 px-1">pnpm icon:generate</code>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
