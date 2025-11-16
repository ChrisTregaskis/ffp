import { Link } from 'react-router-dom';

import { Text, Title } from '@web/components/text';

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
          <Title as="h2" className="mb-2" colour="card-foreground">
            {category.title}
          </Title>
          <Text as="p" className="mb-4" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
            {category.description}
          </Text>

          {/* Example list */}
          <ul className="mb-4 flex-grow space-y-1">
            {category.examples.map((example) => (
              <li key={example}>
                <Text
                  styleProps={{ size: 'sm', colour: 'muted-foreground' }}
                  className="opacity-70"
                >
                  • {example}
                </Text>
              </li>
            ))}
          </ul>

          {/* View button */}
          {category.comingSoon ? (
            <button disabled className="w-full cursor-not-allowed rounded-md bg-muted px-4 py-2">
              <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}>
                Not Yet Implemented
              </Text>
            </button>
          ) : (
            <Link
              to={category.path}
              className="block w-full rounded-md bg-primary px-4 py-2 text-center hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <Text
                styleProps={{ size: 'sm', weight: 'medium' }}
                className="text-primary-foreground"
              >
                View Components
              </Text>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
