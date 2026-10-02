import React from 'react';

import { ListEmptyState } from '@web/components/feedback/ListEmptyState';

interface UserListEmptyStateProps {
  /** Whether search or filter controls are active (changes messaging) */
  hasFilters: boolean;
  /** Callback when the create user button is clicked */
  onCreateClick: () => void;
}

export const UserListEmptyState: React.FC<UserListEmptyStateProps> = ({
  hasFilters,
  onCreateClick,
}) => (
  <ListEmptyState
    hasFilters={hasFilters}
    filteredTitle="No matching users"
    icon="Users"
    iconColour="var(--color-primary)"
    title="No users yet"
    description="Create your first programme user to start onboarding."
    actionLabel="Create User"
    actionIcon="Plus"
    onAction={onCreateClick}
  />
);
