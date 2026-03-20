import React from 'react';

import { Button } from '@web/components/button';
import { StatusResult } from '@web/components/feedback/StatusResult';
import { Icon } from '@web/components/Icon';

interface CustomerListEmptyStateProps {
  /** Whether search or filter controls are active (changes messaging) */
  hasFilters: boolean;
  /** Callback when the create customer button is clicked */
  onCreateClick: () => void;
}

export const CustomerListEmptyState: React.FC<CustomerListEmptyStateProps> = ({
  hasFilters,
  onCreateClick,
}) => {
  if (hasFilters) {
    return (
      <StatusResult
        icon="Search"
        iconColour="var(--color-muted-foreground)"
        iconBg="bg-transparent"
        title="No matching customers"
        description="Try adjusting your search or filters to find what you are looking for."
      />
    );
  }

  return (
    <StatusResult
      icon="Building"
      iconColour="var(--color-primary)"
      iconBg="bg-transparent"
      title="No customers yet"
      description="Create your first customer to start onboarding organisations."
      actions={
        <Button
          variant="secondary"
          icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
          onClick={onCreateClick}
        >
          Create Customer
        </Button>
      }
    />
  );
};
