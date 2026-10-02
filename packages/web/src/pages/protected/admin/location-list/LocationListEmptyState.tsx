import React from 'react';

import { ListEmptyState } from '@web/components/feedback/ListEmptyState';

interface LocationListEmptyStateProps {
  /** Whether search or filter controls are active (changes messaging) */
  hasFilters: boolean;
  /** Callback when the create location button is clicked */
  onCreateClick: () => void;
}

export const LocationListEmptyState: React.FC<LocationListEmptyStateProps> = ({
  hasFilters,
  onCreateClick,
}) => (
  <ListEmptyState
    hasFilters={hasFilters}
    filteredTitle="No matching locations"
    icon="Globe"
    iconColour="var(--color-primary)"
    title="No locations yet"
    description="Create your first location to start managing sites within organisations."
    actionLabel="Create Location"
    actionIcon="Plus"
    onAction={onCreateClick}
  />
);
