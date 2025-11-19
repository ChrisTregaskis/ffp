import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button/Button';
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
export const ComponentCategoriesGrid: React.FC<ComponentCategoriesGridProps> = ({ categories }) => {
  const navigate = useNavigate();

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
            <Button variant="neutral" disabled fullWidth>
              Not Yet Implemented
            </Button>
          ) : (
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                void navigate(category.path);
              }}
            >
              View Components
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};
