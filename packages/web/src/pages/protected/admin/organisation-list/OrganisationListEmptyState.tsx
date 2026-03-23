import React from 'react';

import { Button } from '@web/components/button';
import { StatusResult } from '@web/components/feedback/StatusResult';
import { Icon } from '@web/components/Icon';

interface OrganisationListEmptyStateProps {
  /** Whether search or filter controls are active (changes messaging) */
  hasFilters: boolean;
  /** Callback when the create organisation button is clicked */
  onCreateClick: () => void;
}

export const OrganisationListEmptyState: React.FC<OrganisationListEmptyStateProps> = ({
  hasFilters,
  onCreateClick,
}) => {
  if (hasFilters) {
    return (
      <StatusResult
        icon="Search"
        iconColour="var(--color-muted-foreground)"
        iconBg="bg-transparent"
        title="No matching organisations"
        description="Try adjusting your search or filters to find what you are looking for."
      />
    );
  }

  return (
    <StatusResult
      icon="Building"
      iconColour="var(--color-primary)"
      iconBg="bg-transparent"
      title="No organisations yet"
      description="Create your first organisation to start managing your platform."
      actions={
        <Button
          variant="secondary"
          icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
          onClick={onCreateClick}
        >
          Create Organisation
        </Button>
      }
    />
  );
};
