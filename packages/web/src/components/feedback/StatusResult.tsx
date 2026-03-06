import React from 'react';

import { Icon } from '@web/components/Icon';
import type { IconColour } from '@web/components/Icon/Icon';
import type { IconName } from '@web/components/Icon/types';
import { Text } from '@web/components/text';

import type { ReactNode } from 'react';

export interface StatusResultProps {
  /** Icon to display in the coloured circle */
  icon: IconName;
  /** CSS colour for the icon (e.g., 'var(--color-success)') */
  iconColour: IconColour;
  /** Background class for the icon circle (e.g., 'bg-success/20') */
  iconBg: string;
  /** Main heading text */
  title: string;
  /** Descriptive text below the heading */
  description: string;
  /** Action buttons rendered below the description */
  actions?: ReactNode;
}

/**
 * Centred status result panel with icon, title, description, and optional actions.
 * Used for success states, empty states, or completion screens.
 */
export const StatusResult: React.FC<StatusResultProps> = ({
  icon,
  iconColour,
  iconBg,
  title,
  description,
  actions,
}) => {
  return (
    <div className="flex flex-col items-center py-12">
      <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconBg}`}>
        <Icon name={icon} styleProps={{ size: 'xl', colour: iconColour }} />
      </div>
      <Text styleProps={{ weight: 'semibold', size: 'lg' }} className="mb-2">
        {title}
      </Text>
      <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-6 text-center">
        {description}
      </Text>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
};
