import { Link } from 'react-router-dom';

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
          <Link
            to={backLinkPath}
            className="inline-flex items-center text-sm text-primary hover:opacity-80"
          >
            {backLinkText}
          </Link>
          <div className="rounded-md bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
            Development Only
          </div>
        </div>
      ) : (
        <div className="mb-4 inline-block rounded-md bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
          Development Only
        </div>
      )}
      <h1 className="mb-2 text-3xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
