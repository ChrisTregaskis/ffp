import { Icon } from './Icon';

import type { IconColour, IconSize } from './Icon';
import type { IconName } from './types';

export type IconBadgeSize = 'sm' | 'md' | 'lg';
export type IconBadgeVariant = 'secondary' | 'success' | 'primary' | 'warning' | 'muted';
export type IconBadgeAppearance = 'soft' | 'solid';
export type IconBadgeShape = 'square' | 'circle';

const BADGE_SIZE_MAP: Record<IconBadgeSize, { container: string; icon: IconSize }> = {
  sm: { container: 'h-8 w-8', icon: 'sm' },
  md: { container: 'h-11 w-11', icon: 'md' },
  lg: { container: 'h-14 w-14', icon: 'lg' },
};

const BADGE_VARIANT_MAP: Record<
  IconBadgeVariant,
  { soft: { bg: string; colour: IconColour }; solid: { bg: string; colour: IconColour } }
> = {
  secondary: {
    soft: { bg: 'bg-gradient-to-br from-secondary to-primary/20', colour: 'var(--color-primary)' },
    solid: {
      bg: 'bg-gradient-to-br from-primary to-primary/80 shadow-lg',
      colour: '#ffffff',
    },
  },
  success: {
    soft: { bg: 'bg-success/20', colour: 'var(--color-success)' },
    solid: { bg: 'bg-success shadow-lg', colour: '#ffffff' },
  },
  primary: {
    soft: { bg: 'bg-primary/20', colour: 'var(--color-primary)' },
    solid: { bg: 'bg-gradient-to-br from-primary to-primary/80 shadow-lg', colour: '#ffffff' },
  },
  warning: {
    soft: { bg: 'bg-warning/20', colour: 'var(--color-warning)' },
    solid: { bg: 'bg-warning shadow-lg', colour: '#ffffff' },
  },
  muted: {
    soft: { bg: 'bg-muted', colour: 'var(--color-muted-foreground)' },
    solid: { bg: 'bg-muted-foreground shadow-lg', colour: '#ffffff' },
  },
};

const SHAPE_MAP: Record<IconBadgeShape, string> = {
  square: 'rounded-xl',
  circle: 'rounded-full',
};

export interface IconBadgeProps {
  /** Icon to display */
  name: IconName;
  /** Size of the badge container and icon */
  size?: IconBadgeSize;
  /** Colour variant for background and icon */
  variant?: IconBadgeVariant;
  /** Appearance style @default 'soft' */
  appearance?: IconBadgeAppearance;
  /** Badge shape @default 'square' */
  shape?: IconBadgeShape;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Icon within a rounded badge container.
 *
 * Renders an icon inside a coloured background.
 * Supports soft (translucent) and solid (filled with shadow) appearances,
 * and square (rounded-xl) or circle (rounded-full) shapes.
 */
export const IconBadge: React.FC<IconBadgeProps> = ({
  name,
  size = 'md',
  variant = 'secondary',
  appearance = 'soft',
  shape = 'square',
  className = '',
}) => {
  const { container, icon } = BADGE_SIZE_MAP[size];
  const { bg, colour } = BADGE_VARIANT_MAP[variant][appearance];
  const radius = SHAPE_MAP[shape];

  return (
    <div
      className={`inline-flex items-center justify-center ${radius} transition-transform duration-200 hover:scale-110 ${bg} ${container} ${className}`.trim()}
    >
      <Icon name={name} styleProps={{ size: icon, colour }} />
    </div>
  );
};
