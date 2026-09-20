import React from 'react';

import { Button } from '@web/components/button';
import { StatusResult } from '@web/components/feedback/StatusResult';
import { Icon } from '@web/components/Icon';

interface AssessmentFlowListEmptyStateProps {
  /** Whether search or filter controls are active (changes messaging) */
  hasFilters: boolean;
  /** Callback when the create flow button is clicked */
  onCreateClick: () => void;
}

export const AssessmentFlowListEmptyState: React.FC<AssessmentFlowListEmptyStateProps> = ({
  hasFilters,
  onCreateClick,
}) => {
  if (hasFilters) {
    return (
      <StatusResult
        icon="Search"
        iconColour="var(--color-muted-foreground)"
        iconBg="bg-transparent"
        title="No matching flows"
        description="Try adjusting your search or filters to find what you are looking for."
      />
    );
  }

  return (
    <StatusResult
      icon="ClipboardList"
      iconColour="var(--color-muted-foreground)"
      iconBg="bg-transparent"
      title="No assessment flows yet"
      description="Create your first flow to start shaping the wellness journey members take."
      actions={
        <Button
          variant="secondary"
          icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
          onClick={onCreateClick}
        >
          Create Flow
        </Button>
      }
    />
  );
};
