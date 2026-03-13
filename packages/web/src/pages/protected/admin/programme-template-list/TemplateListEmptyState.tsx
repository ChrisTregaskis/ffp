import React from 'react';

import { Button } from '@web/components/button';
import { StatusResult } from '@web/components/feedback/StatusResult';
import { Icon } from '@web/components/Icon';

interface TemplateListEmptyStateProps {
  /** Whether search or filter controls are active (changes messaging) */
  hasFilters: boolean;
  /** Callback when the create template button is clicked */
  onCreateClick: () => void;
}

export const TemplateListEmptyState: React.FC<TemplateListEmptyStateProps> = ({
  hasFilters,
  onCreateClick,
}) => {
  if (hasFilters) {
    return (
      <StatusResult
        icon="Search"
        iconColour="var(--color-muted-foreground)"
        iconBg="bg-transparent"
        title="No matching templates"
        description="Try adjusting your search or filters to find what you are looking for."
      />
    );
  }

  return (
    <StatusResult
      icon="ClipboardList"
      iconColour="var(--color-muted-foreground)"
      iconBg="bg-transparent"
      title="No programme templates yet"
      description="Create your first programme template to start building workout programmes."
      actions={
        <Button
          variant="secondary"
          icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
          onClick={onCreateClick}
        >
          Create Template
        </Button>
      }
    />
  );
};
