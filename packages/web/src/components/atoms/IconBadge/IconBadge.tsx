import { Icon } from '../Icon';

import type { IconColour, IconSize, IconName } from '../Icon';

export type IconBadgeSize = 'sm' | 'md' | 'lg' | 'xl';
export type IconBadgeVariant =
  | 'secondary'
  | 'success'
  | 'primary'
  | 'warning'
  | 'muted'
  | 'neutral';
/** `soft` translucent fill · `solid` filled · `plain` no fill, the icon alone in the variant's colour */
export type IconBadgeAppearance = 'soft' | 'solid' | 'plain';
export type IconBadgeShape = 'square' | 'circle';

const BADGE_SIZE_MAP: Record<IconBadgeSize, { container: string; icon: IconSize }> = {
  sm: { container: 'h-8 w-8', icon: 'sm' },
  md: { container: 'h-11 w-11', icon: 'md' },
  lg: { container: 'h-14 w-14', icon: 'lg' },
  xl: { container: 'h-16 w-16', icon: 'xl' },
};

const BADGE_VARIANT_MAP: Record<
  IconBadgeVariant,
  { soft: { bg: string; colour: IconColour }; solid: { bg: string; colour: IconColour } }
> = {
  secondary: {
    soft: { bg: 'bg-gradient-to-br from-secondary to-primary/20', colour: 'var(--color-primary)' },
    solid: { bg: 'bg-gradient-to-br from-primary to-primary/80', colour: '#ffffff' },
  },
  success: {
    soft: { bg: 'bg-success/20', colour: 'var(--color-success)' },
    solid: { bg: 'bg-success', colour: '#ffffff' },
  },
  primary: {
    soft: { bg: 'bg-primary/20', colour: 'var(--color-primary)' },
    solid: { bg: 'bg-gradient-to-br from-primary to-primary/80', colour: '#ffffff' },
  },
  warning: {
    soft: { bg: 'bg-warning/20', colour: 'var(--color-warning)' },
    solid: { bg: 'bg-warning', colour: '#ffffff' },
  },
  muted: {
    soft: { bg: 'bg-muted', colour: 'var(--color-muted-foreground)' },
    solid: { bg: 'bg-muted-foreground', colour: '#ffffff' },
  },
  neutral: {
    soft: { bg: 'bg-muted-foreground/20', colour: 'var(--color-muted-foreground)' },
    solid: { bg: 'bg-muted-foreground', colour: '#ffffff' },
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
  /** A flat badge that marks a state rather than decorating content: no hover lift, no solid shadow */
  static?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Icon within a rounded badge container.
 *
 * Renders an icon inside a coloured background.
 * Supports soft (translucent), solid (filled with shadow) and plain (no fill) appearances,
 * and square (rounded-xl) or circle (rounded-full) shapes.
 */
export const IconBadge: React.FC<IconBadgeProps> = ({
  name,
  size = 'md',
  variant = 'secondary',
  appearance = 'soft',
  shape = 'square',
  static: isStatic = false,
  className = '',
}) => {
  const { container, icon } = BADGE_SIZE_MAP[size];
  const { soft, solid } = BADGE_VARIANT_MAP[variant];
  const bg = { soft: soft.bg, solid: solid.bg, plain: '' }[appearance];
  const colour = appearance === 'solid' ? solid.colour : soft.colour;
  const shadow = appearance === 'solid' && !isStatic ? 'shadow-lg' : '';
  const motion = isStatic ? '' : 'transition-transform duration-200 hover:scale-110';
  const classes = [
    'inline-flex items-center justify-center',
    SHAPE_MAP[shape],
    motion,
    bg,
    shadow,
    container,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <Icon name={name} styleProps={{ size: icon, colour }} />
    </div>
  );
};
