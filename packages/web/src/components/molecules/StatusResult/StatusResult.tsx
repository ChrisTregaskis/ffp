import type {
  IconBadgeAppearance,
  IconBadgeSize,
  IconBadgeVariant,
  IconName,
  TextColour,
  TextSize,
  TitleLevel,
} from '@web/components/atoms';
import { IconBadge, Text, Title } from '@web/components/atoms';

import type { ReactNode } from 'react';

/**
 * `default` pads itself and spaces for a standalone result.
 * `feature` and `compact` leave the padding to the card or page around them:
 * `feature` keeps base copy in a narrow column, `compact` sets small copy under a wider gap and
 * stretches its actions to full width.
 */
export type StatusResultSpacing = 'default' | 'feature' | 'compact';

interface SpacingClasses {
  container: string;
  icon: string;
  description: string;
  descriptionSize: TextSize;
  actions: string;
}

const SPACING_MAP: Record<StatusResultSpacing, SpacingClasses> = {
  default: {
    container: 'py-12',
    icon: 'mb-4',
    description: 'mb-6',
    descriptionSize: 'base',
    actions: 'flex gap-3',
  },
  feature: {
    container: '',
    icon: 'mb-4',
    description: 'max-w-sm not-last:mb-8',
    descriptionSize: 'base',
    actions: 'flex gap-3',
  },
  compact: {
    container: '',
    icon: 'mb-6',
    description: '',
    descriptionSize: 'sm',
    actions: 'mt-6 flex w-full flex-col gap-3',
  },
};

export interface StatusResultProps {
  /** Icon shown in a circle above the heading; leave out for a text-only result */
  icon?: IconName;
  /** The circle's colour @default 'neutral' */
  iconVariant?: IconBadgeVariant;
  /** @default 'soft' */
  iconAppearance?: IconBadgeAppearance;
  /** @default 'xl' */
  iconSize?: IconBadgeSize;
  /** Main heading text */
  title: string;
  /** Renders the heading as a `Title` at this level; left out, it is large semibold text */
  titleAs?: TitleLevel;
  /** @default 'foreground' */
  titleColour?: TextColour;
  /** Descriptive text below the heading */
  description?: string;
  /** @default 'default' */
  spacing?: StatusResultSpacing;
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
  iconSize = 'xl',
  title,
  titleAs,
  titleColour = 'foreground',
  description,
  spacing = 'default',
  children,
  actions,
}) => {
  const classes = SPACING_MAP[spacing];

  return (
    <div className={`flex flex-col items-center ${classes.container}`.trim()}>
      {icon && (
        <IconBadge
          name={icon}
          size={iconSize}
          shape="circle"
          variant={iconVariant}
          appearance={iconAppearance}
          static
          className={classes.icon}
        />
      )}
      {titleAs ? (
        <Title as={titleAs} colour={titleColour} className="mb-2 text-center">
          {title}
        </Title>
      ) : (
        <Text styleProps={{ weight: 'semibold', size: 'lg', colour: titleColour }} className="mb-2">
          {title}
        </Text>
      )}
      {description && (
        <Text
          as="p"
          styleProps={{ colour: 'muted-foreground', size: classes.descriptionSize }}
          className={`${classes.description} text-center`.trim()}
        >
          {description}
        </Text>
      )}
      {children}
      {actions && <div className={classes.actions}>{actions}</div>}
    </div>
  );
};
