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
 * Map colours to explicit Tailwind class names.
 * Required for Tailwind JIT compiler to detect and generate classes.
 */
const COLOUR_CLASS_MAP: Record<TextColour, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success',
  destructive: 'text-destructive',
  foreground: 'text-foreground',
  'muted-foreground': 'text-muted-foreground',
  'card-foreground': 'text-card-foreground',
  'accent-foreground': 'text-accent-foreground',
};

/**
 * Map weights to explicit Tailwind class names.
 */
const WEIGHT_CLASS_MAP: Record<TextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

/**
 * Map sizes to explicit Tailwind class names.
 */
const SIZE_CLASS_MAP: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
};

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
 */
export const Text: React.FC<TextProps> = ({
  children,
  styleProps,
  as = 'span',
  truncationLength,
  className = '',
}): JSX.Element => {
  const colour = styleProps?.colour ?? 'foreground';
  const weight = styleProps?.weight ?? 'normal';
  const size = styleProps?.size ?? 'base';

  const colourClass = COLOUR_CLASS_MAP[colour];
  const weightClass = WEIGHT_CLASS_MAP[weight];
  const sizeClass = SIZE_CLASS_MAP[size];

  const classes = `${colourClass} ${weightClass} ${sizeClass} ${className}`.trim();

  // Apply truncation if specified
  const formattedChildren =
    truncationLength && typeof children === 'string' && children.length > truncationLength
      ? `${children.slice(0, truncationLength)}...`
      : children;

  const Component = as;

  return <Component className={classes}>{formattedChildren}</Component>;
};
