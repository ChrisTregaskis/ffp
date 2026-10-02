import React from 'react';

import { ListEmptyState } from '@web/components/feedback/ListEmptyState';

interface TemplateListEmptyStateProps {
  /** Whether the list is narrowed beyond its default filter (changes messaging) */
  hasFilters: boolean;
  /** Callback when the create template button is clicked */
  onCreateClick: () => void;
}

export const TemplateListEmptyState: React.FC<TemplateListEmptyStateProps> = ({
  hasFilters,
  onCreateClick,
}) => (
  <ListEmptyState
    hasFilters={hasFilters}
    filteredTitle="No matching templates"
    icon="ClipboardList"
    iconColour="var(--color-muted-foreground)"
    title="No programme templates yet"
    description="Create your first programme template to start building workout programmes."
    actionLabel="Create Template"
    actionIcon="Plus"
    onAction={onCreateClick}
  />
);
