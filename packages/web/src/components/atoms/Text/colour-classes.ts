import type { TextColour } from './Text';

/**
 * Map colours to explicit Tailwind class names.
 * Required for Tailwind JIT compiler to detect and generate classes.
 * Shared by Text and Title.
 */
export const COLOUR_CLASS_MAP: Record<TextColour, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success',
  destructive: 'text-destructive',
  foreground: 'text-foreground',
  'muted-foreground': 'text-muted-foreground',
  'card-foreground': 'text-card-foreground',
  'accent-foreground': 'text-accent-foreground',
  warning: 'text-warning',
  info: 'text-info',
  white: 'text-white',
  'ffp-navy': 'text-ffp-navy',
};
