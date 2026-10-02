import React from 'react';

import { ListEmptyState } from '@web/components/feedback/ListEmptyState';

interface OrganisationListEmptyStateProps {
  /** Whether search or filter controls are active (changes messaging) */
  hasFilters: boolean;
  /** Callback when the create organisation button is clicked */
  onCreateClick: () => void;
}

export const OrganisationListEmptyState: React.FC<OrganisationListEmptyStateProps> = ({
  hasFilters,
  onCreateClick,
}) => (
  <ListEmptyState
    hasFilters={hasFilters}
    filteredTitle="No matching organisations"
    icon="Building"
    iconColour="var(--color-primary)"
    title="No organisations yet"
    description="Create your first organisation to start managing your platform."
    actionLabel="Create Organisation"
    actionIcon="Plus"
    onAction={onCreateClick}
  />
);
