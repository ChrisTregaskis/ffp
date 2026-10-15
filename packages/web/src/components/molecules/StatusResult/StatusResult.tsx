import React from 'react';

import type { IconBadgeAppearance, IconBadgeVariant, IconName } from '@web/components/atoms';
import { IconBadge, Text } from '@web/components/atoms';

import type { ReactNode } from 'react';

export interface StatusResultProps {
  /** Icon shown in a circle above the heading; leave out for a text-only result */
  icon?: IconName;
  /** The circle's colour @default 'neutral' */
  iconVariant?: IconBadgeVariant;
  /** @default 'soft' */
  iconAppearance?: IconBadgeAppearance;
  /** Main heading text */
  title: string;
  /** Descriptive text below the heading */
  description?: string;
  /** Content between the description and the actions */
  children?: ReactNode;
  /** Action buttons rendered last */
  actions?: ReactNode;
}

/**
 * Centred status result panel with icon, title, description, and optional actions.
 * Used for success, empty, error and completion states.
 */
export const StatusResult: React.FC<StatusResultProps> = ({
  icon,
  iconVariant = 'neutral',
  iconAppearance = 'soft',
  title,
  description,
  children,
  actions,
}) => {
  return (
    <div className="flex flex-col items-center py-12">
      {icon && (
        <IconBadge
          name={icon}
          size="xl"
          shape="circle"
          variant={iconVariant}
          appearance={iconAppearance}
          static
          className="mb-4"
        />
      )}
      <Text styleProps={{ weight: 'semibold', size: 'lg' }} className="mb-2">
        {title}
      </Text>
      {description && (
        <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-6 text-center">
          {description}
        </Text>
      )}
      {children}
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
};
