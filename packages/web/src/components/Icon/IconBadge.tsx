import { Icon } from './Icon';

import type { IconColour, IconSize } from './Icon';
import type { IconName } from './types';

export type IconBadgeSize = 'sm' | 'md' | 'lg';
export type IconBadgeVariant = 'secondary' | 'success' | 'primary' | 'warning' | 'muted';

const BADGE_SIZE_MAP: Record<IconBadgeSize, { container: string; icon: IconSize }> = {
  sm: { container: 'h-8 w-8', icon: 'sm' },
  md: { container: 'h-11 w-11', icon: 'md' },
  lg: { container: 'h-14 w-14', icon: 'lg' },
};

const BADGE_VARIANT_MAP: Record<IconBadgeVariant, { bg: string; colour: IconColour }> = {
  secondary: {
    bg: 'bg-gradient-to-br from-secondary to-primary/20',
    colour: 'var(--color-primary)',
  },
  success: { bg: 'bg-success/20', colour: 'var(--color-success)' },
  primary: { bg: 'bg-primary/20', colour: 'var(--color-primary)' },
  warning: { bg: 'bg-warning/20', colour: 'var(--color-warning)' },
  muted: { bg: 'bg-muted', colour: 'var(--color-muted-foreground)' },
};

export interface IconBadgeProps {
  /** Icon to display */
  name: IconName;
  /** Size of the badge container and icon */
  size?: IconBadgeSize;
  /** Colour variant for background and icon */
  variant?: IconBadgeVariant;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Icon within a rounded badge container.
 *
 * Renders an icon inside a coloured, rounded-square background.
 * Useful for feature highlights, checklists, and step indicators.
 */
export const IconBadge: React.FC<IconBadgeProps> = ({
  name,
  size = 'md',
  variant = 'secondary',
  className = '',
}) => {
  const { container, icon } = BADGE_SIZE_MAP[size];
  const { bg, colour } = BADGE_VARIANT_MAP[variant];

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl transition-transform duration-200 hover:scale-110 ${bg} ${container} ${className}`.trim()}
    >
      <Icon name={name} styleProps={{ size: icon, colour }} />
    </div>
  );
};
