import { Link } from 'react-router-dom';

export interface ComponentCategory {
  title: string;
  description: string;
  path: string;
  examples: string[];
  comingSoon?: boolean;
}

interface ComponentCategoriesGridProps {
  categories: ComponentCategory[];
}

/**
 * Grid display of component categories (development only).
 *
 * Renders a responsive grid of component category cards with:
 * - Category title and description
 * - Example features list
 * - "Coming Soon" badge for unimplemented categories
 * - Navigation links to category pages
 */
export function ComponentCategoriesGrid({ categories }: ComponentCategoriesGridProps): JSX.Element {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <div
          key={category.path}
          className="relative flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          {category.comingSoon && (
            <div className="absolute right-4 top-4 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              Coming Soon
            </div>
          )}

          <h2 className="mb-2 text-xl font-semibold text-card-foreground">{category.title}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{category.description}</p>

          {/* Example list */}
          <ul className="mb-4 flex-grow space-y-1">
            {category.examples.map((example) => (
              <li key={example} className="text-sm text-muted-foreground/70">
                • {example}
              </li>
            ))}
          </ul>

          {/* View button */}
          {category.comingSoon ? (
            <button
              disabled
              className="w-full cursor-not-allowed rounded-md bg-muted px-4 py-2 text-sm font-medium text-muted-foreground"
            >
              Not Yet Implemented
            </button>
          ) : (
            <Link
              to={category.path}
              className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              View Components
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
