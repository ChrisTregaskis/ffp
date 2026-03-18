import React from 'react';

import { Text } from '@web/components/text';

import type { ReactNode } from 'react';

export interface EmptyStateProps {
  /** Primary message to display */
  message: string;
  /** Optional action element (e.g. a button) */
  action?: ReactNode;
}

/** Dashed-border empty state card for lists and tables with no data. */
export const EmptyState: React.FC<EmptyStateProps> = ({ message, action }) => {
  return (
    <div className="rounded-lg border border-dashed border-border bg-white py-8 text-center">
      <Text as="p" styleProps={{ colour: 'muted-foreground' }} className={action ? 'mb-3' : ''}>
        {message}
      </Text>
      {action}
    </div>
  );
};
