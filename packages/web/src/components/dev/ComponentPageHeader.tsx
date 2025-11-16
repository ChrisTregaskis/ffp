import { Link } from 'react-router-dom';

import { Text, Title } from '@web/components/text';

interface ComponentPageHeaderProps {
  title: string;
  description: string;
  showBackLink?: boolean;
  backLinkPath?: string;
  backLinkText?: string;
}

/**
 * Header for component showcase pages (development only).
 *
 * Provides consistent page header with:
 * - Optional back navigation link
 * - "Development Only" badge
 * - Page title and description
 *
 * @example
 * ```tsx
 * <ComponentPageHeader
 *   title="Icon Components"
 *   description="Complete icon library with size and colour variations"
 *   showBackLink
 * />
 * ```
 */
export function ComponentPageHeader({
  title,
  description,
  showBackLink = false,
  backLinkPath = '/components',
  backLinkText = '← Back to Components',
}: ComponentPageHeaderProps): JSX.Element {
  return (
    <div className="mb-8">
      {showBackLink ? (
        <div className="mb-4 flex items-center justify-between">
          <Link to={backLinkPath} className="inline-flex items-center hover:opacity-80">
            <Text styleProps={{ size: 'sm', colour: 'primary' }}>{backLinkText}</Text>
          </Link>
          <div className="rounded-md bg-yellow-100 px-3 py-1">
            <Text styleProps={{ size: 'sm', weight: 'medium' }} className="text-yellow-800">
              Development Only
            </Text>
          </div>
        </div>
      ) : (
        <div className="mb-4 inline-block rounded-md bg-yellow-100 px-3 py-1">
          <Text styleProps={{ size: 'sm', weight: 'medium' }} className="text-yellow-800">
            Development Only
          </Text>
        </div>
      )}
      <Title as="h1" className="mb-2">
        {title}
      </Title>
      <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
        {description}
      </Text>
    </div>
  );
}
