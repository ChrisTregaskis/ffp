import React from 'react';

import { Button } from '@web/components/button';
import { StatusResult } from '@web/components/feedback/StatusResult';
import { Icon } from '@web/components/Icon';

interface LocationListEmptyStateProps {
  /** Whether search or filter controls are active (changes messaging) */
  hasFilters: boolean;
  /** Callback when the create location button is clicked */
  onCreateClick: () => void;
}

export const LocationListEmptyState: React.FC<LocationListEmptyStateProps> = ({
  hasFilters,
  onCreateClick,
}) => {
  if (hasFilters) {
    return (
      <StatusResult
        icon="Search"
        iconColour="var(--color-muted-foreground)"
        iconBg="bg-transparent"
        title="No matching locations"
        description="Try adjusting your search or filters to find what you are looking for."
      />
    );
  }

  return (
    <StatusResult
      icon="Globe"
      iconColour="var(--color-primary)"
      iconBg="bg-transparent"
      title="No locations yet"
      description="Create your first location to start managing sites within organisations."
      actions={
        <Button
          variant="secondary"
          icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
          onClick={onCreateClick}
        >
          Create Location
        </Button>
      }
    />
  );
};
