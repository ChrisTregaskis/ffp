import React from 'react';

import { ListEmptyState } from '@web/components/feedback/ListEmptyState';

interface AssessmentFlowListEmptyStateProps {
  /** Whether the list is narrowed beyond its default filter (changes messaging) */
  hasFilters: boolean;
  /** Callback when the create flow button is clicked */
  onCreateClick: () => void;
}

export const AssessmentFlowListEmptyState: React.FC<AssessmentFlowListEmptyStateProps> = ({
  hasFilters,
  onCreateClick,
}) => (
  <ListEmptyState
    hasFilters={hasFilters}
    filteredTitle="No matching flows"
    icon="ClipboardList"
    iconColour="var(--color-muted-foreground)"
    title="No assessment flows yet"
    description="Create your first flow to start shaping the wellness journey members take."
    actionLabel="Create Flow"
    actionIcon="Plus"
    onAction={onCreateClick}
  />
);
