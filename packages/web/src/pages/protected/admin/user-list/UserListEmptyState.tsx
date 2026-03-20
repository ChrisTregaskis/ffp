import React from 'react';

import { Button } from '@web/components/button';
import { StatusResult } from '@web/components/feedback/StatusResult';
import { Icon } from '@web/components/Icon';

interface UserListEmptyStateProps {
  /** Whether search or filter controls are active (changes messaging) */
  hasFilters: boolean;
  /** Callback when the create user button is clicked */
  onCreateClick: () => void;
}

export const UserListEmptyState: React.FC<UserListEmptyStateProps> = ({
  hasFilters,
  onCreateClick,
}) => {
  if (hasFilters) {
    return (
      <StatusResult
        icon="Search"
        iconColour="var(--color-muted-foreground)"
        iconBg="bg-transparent"
        title="No matching users"
        description="Try adjusting your search or filters to find what you are looking for."
      />
    );
  }

  return (
    <StatusResult
      icon="Users"
      iconColour="var(--color-primary)"
      iconBg="bg-transparent"
      title="No users yet"
      description="Create your first programme user to start onboarding."
      actions={
        <Button
          variant="secondary"
          icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
          onClick={onCreateClick}
        >
          Create User
        </Button>
      }
    />
  );
};
