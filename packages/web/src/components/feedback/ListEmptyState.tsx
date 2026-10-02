import React from 'react';

import { Button } from '@web/components/button';
import { StatusResult } from '@web/components/feedback/StatusResult';
import { Icon } from '@web/components/Icon';
import type { IconColour } from '@web/components/Icon/Icon';
import type { IconName } from '@web/components/Icon/types';

export interface ListEmptyStateProps {
  /** The list is narrowed, so no row is a match rather than an absence */
  hasFilters: boolean;
  /** Heading for the narrowed case, e.g. "No matching users" */
  filteredTitle: string;
  /** Icon for the nothing-here-yet case */
  icon: IconName;
  /** Icon colour for the nothing-here-yet case */
  iconColour: IconColour;
  /** Heading for the nothing-here-yet case, e.g. "No users yet" */
  title: string;
  /** Supporting copy for the nothing-here-yet case */
  description: string;
  /** Call to action offered only when the list is genuinely empty */
  actionLabel: string;
  /** Icon for that call to action */
  actionIcon: IconName;
  /** Invoked by the call to action */
  onAction: () => void;
}

/**
 * Empty state for an admin list table. Nothing created yet offers the create call to
 * action; narrowed by search or filters does not.
 */
export const ListEmptyState: React.FC<ListEmptyStateProps> = ({
  hasFilters,
  filteredTitle,
  icon,
  iconColour,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
}) => {
  if (hasFilters) {
    return (
      <StatusResult
        icon="Search"
        iconColour="var(--color-muted-foreground)"
        iconBg="bg-transparent"
        title={filteredTitle}
        description="Try adjusting your search or filters to find what you are looking for."
      />
    );
  }

  return (
    <StatusResult
      icon={icon}
      iconColour={iconColour}
      iconBg="bg-transparent"
      title={title}
      description={description}
      actions={
        <Button
          variant="secondary"
          icon={<Icon name={actionIcon} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      }
    />
  );
};
