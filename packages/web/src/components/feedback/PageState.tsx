import React from 'react';

import { Button } from '@web/components/button';
import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { Text } from '@web/components/text';

export interface PageStateProps {
  /** When true, shows a centred loading spinner instead of the error content */
  isLoading?: boolean;
  /** Error heading @default "Unable to load content" */
  title?: string;
  /** Error detail message */
  message?: string;
  /** Action button label */
  actionLabel?: string;
  /** Action button click handler */
  onAction?: () => void;
}

/**
 * Page content state card for loading and error states.
 *
 * Renders a white bordered card with either a centred loading spinner
 * or an error message with an action button. Intended for use on
 * detail/edit pages where the primary content has not yet loaded.
 */
export const PageState: React.FC<PageStateProps> = ({
  isLoading = false,
  title = 'Unable to load content',
  message,
  actionLabel,
  onAction,
}) => (
  <div className="rounded-lg border border-border bg-white p-6">
    {isLoading ? (
      <LoadingSpinner size="lg" variant="center" className="py-16" />
    ) : (
      <div className="flex flex-col items-center py-12">
        <Text styleProps={{ weight: 'semibold', size: 'lg' }} className="mb-2">
          {title}
        </Text>
        {message && (
          <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-6 text-center">
            {message}
          </Text>
        )}
        {actionLabel && onAction && (
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    )}
  </div>
);
