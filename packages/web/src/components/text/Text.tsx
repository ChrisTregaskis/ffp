import type { ReactNode } from 'react';

/**
 * Available text colours based on FFP theme.
 */
export type TextColour =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'destructive'
  | 'foreground'
  | 'muted-foreground'
  | 'card-foreground'
  | 'accent-foreground';

/**
 * Available text sizes based on FFP theme.
 */
export type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

/**
 * Available font weights based on FFP theme.
 */
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

/**
 * Text style properties.
 */
export interface TextStyleProps {
  /** Text colour @default 'foreground' */
  colour?: TextColour;
  /** Font weight @default 'normal' */
  weight?: TextWeight;
  /** Text size @default 'base' */
  size?: TextSize;
}

export interface TextProps {
  /** Text content */
  children: ReactNode;
  /** Style properties */
  styleProps?: TextStyleProps;
  /** HTML element to render @default 'span' */
  as?: 'span' | 'p';
  /** If provided, truncates text to this length and appends '...' */
  truncationLength?: number;
  /** Additional custom classes */
  className?: string;
}

/**
 * Text component for consistent typography across the application.
 *
 * Uses FFP theme colours, sizes, and weights defined in index.css.
 *
 * @example
 * ```tsx
 * <Text styleProps={{ colour: 'primary', size: 'lg', weight: 'semibold' }}>
 *   Important message
 * </Text>
 * ```
 *
 * @example
 * ```tsx
 * <Text as="p" styleProps={{ colour: 'muted-foreground', size: 'sm' }}>
 *   Description text
 * </Text>
 * ```
 */
export function Text({
  children,
  styleProps,
  as = 'span',
  truncationLength,
  className = '',
}: TextProps): JSX.Element {
  const colour = styleProps?.colour ?? 'foreground';
  const weight = styleProps?.weight ?? 'normal';
  const size = styleProps?.size ?? 'base';

  // Map colours to explicit class names for Tailwind JIT
  const colourClassMap: Record<TextColour, string> = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-success',
    destructive: 'text-destructive',
    foreground: 'text-foreground',
    'muted-foreground': 'text-muted-foreground',
    'card-foreground': 'text-card-foreground',
    'accent-foreground': 'text-accent-foreground',
  };

  // Map weights to explicit class names
  const weightClassMap: Record<TextWeight, string> = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  // Map sizes to explicit class names
  const sizeClassMap: Record<TextSize, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };

  const colourClass = colourClassMap[colour];
  const weightClass = weightClassMap[weight];
  const sizeClass = sizeClassMap[size];

  const classes = `${colourClass} ${weightClass} ${sizeClass} ${className}`.trim();

  // Apply truncation if specified
  const formattedChildren =
    truncationLength && typeof children === 'string' && children.length > truncationLength
      ? `${children.slice(0, truncationLength)}...`
      : children;

  const Component = as;

  return <Component className={classes}>{formattedChildren}</Component>;
}
