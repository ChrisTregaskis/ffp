import React from 'react';

import { ListEmptyState } from '@web/components/feedback/ListEmptyState';

interface QuestionListEmptyStateProps {
  /** Whether the list is narrowed beyond its default filter (changes messaging) */
  hasFilters: boolean;
  onCreateClick: () => void;
}

export const QuestionListEmptyState: React.FC<QuestionListEmptyStateProps> = ({
  hasFilters,
  onCreateClick,
}) => (
  <ListEmptyState
    hasFilters={hasFilters}
    filteredTitle="No matching questions"
    icon="HelpCircle"
    iconColour="var(--color-muted-foreground)"
    title="No questions yet"
    description="Write your first question to start building assessments from the bank."
    actionLabel="Create Question"
    actionIcon="Plus"
    onAction={onCreateClick}
  />
);
