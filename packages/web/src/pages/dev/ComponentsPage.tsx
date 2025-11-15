import { Link } from 'react-router-dom';

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
  const componentCategories = [
    {
      title: 'Form Components',
      description: 'Input fields, validation, and form utilities',
      path: '/components/form',
      examples: ['Email input', 'Password input', 'Text input', 'Form validation'],
    },
    {
      title: 'Icon Components',
      description: 'Icon library and usage examples',
      path: '/components/icon',
      examples: ['Icon grid', 'Icon sizing', 'Icon colours'],
    },
    {
      title: 'Button Components',
      description: 'Buttons, links, and call-to-action elements',
      path: '/components/button',
      examples: ['Primary button', 'Secondary button', 'Icon button'],
      comingSoon: true,
    },
    {
      title: 'Modal Components',
      description: 'Dialogs, modals, and overlays',
      path: '/components/modal',
      examples: ['Alert modal', 'Confirmation modal', 'Form modal'],
      comingSoon: true,
    },
    {
      title: 'Table Components',
      description: 'Data tables, grids, and lists',
      path: '/components/table',
      examples: ['Basic table', 'Sortable table', 'Paginated table'],
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 inline-block rounded-md bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
            Development Only
          </div>
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Component Showcase</h1>
          <p className="text-lg text-gray-600">
            Interactive demonstrations of all UI components used in Fit For Purpose
          </p>
        </div>

        {/* Component categories grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {componentCategories.map((category) => (
            <div
              key={category.path}
              className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              {category.comingSoon && (
                <div className="absolute right-4 top-4 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  Coming Soon
                </div>
              )}

              <h2 className="mb-2 text-xl font-semibold text-gray-900">{category.title}</h2>
              <p className="mb-4 text-sm text-gray-600">{category.description}</p>

              {/* Example list */}
              <ul className="mb-4 space-y-1">
                {category.examples.map((example) => (
                  <li key={example} className="text-sm text-gray-500">
                    • {example}
                  </li>
                ))}
              </ul>

              {/* View button */}
              {category.comingSoon ? (
                <button
                  disabled
                  className="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
                >
                  Not Yet Implemented
                </button>
              ) : (
                <Link
                  to={category.path}
                  className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  View Components
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-8 rounded-lg bg-blue-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-blue-900">Adding New Components</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-blue-700">
            <li>
              Add route key to <code className="rounded bg-blue-100 px-1">RouteKey.ts</code>
            </li>
            <li>
              Create component demo page in{' '}
              <code className="rounded bg-blue-100 px-1">pages/dev/</code>
            </li>
            <li>
              Add route config to <code className="rounded bg-blue-100 px-1">routes/index.ts</code>{' '}
              (dev-only section)
            </li>
            <li>Update this landing page with the new category</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
