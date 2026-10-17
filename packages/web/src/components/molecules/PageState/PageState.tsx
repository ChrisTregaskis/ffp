import React from 'react';

import { Button, Surface } from '@web/components/atoms';

import { LoadingState } from '../LoadingState';
import { StatusResult } from '../StatusResult';

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
 * Renders a bordered card with either a centred loading spinner
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
  <Surface padding="lg">
    {isLoading ? (
      <LoadingState />
    ) : (
      <StatusResult
        title={title}
        description={message}
        actions={
          actionLabel &&
          onAction && (
            <Button variant="secondary" onClick={onAction}>
              {actionLabel}
            </Button>
          )
        }
      />
    )}
  </Surface>
);
