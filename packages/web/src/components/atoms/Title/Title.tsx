import { COLOUR_CLASS_MAP } from '../Text/colour-classes';

import type { TextColour } from '../Text';
import type { ReactNode } from 'react';

/**
 * Available heading levels.
 */
export type TitleLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5';

/**
 * Map heading levels to Tailwind text size classes.
 */
const SIZE_MAP: Record<TitleLevel, string> = {
  h1: 'text-4xl',
  h2: 'text-3xl',
  h3: 'text-2xl',
  h4: 'text-xl',
  h5: 'text-lg',
};

export interface TitleProps {
  /** Title content */
  children: ReactNode;
  /** Heading level @default 'h2' */
  as?: TitleLevel;
  /** Text colour @default 'foreground' */
  colour?: TextColour;
  /** Additional custom classes */
  className?: string;
}

/**
 * Title component for consistent heading typography.
 *
 * Automatically applies appropriate size and weight based on heading level.
 * Uses FFP theme colours defined in index.css.
 *
 */
export const Title: React.FC<TitleProps> = ({
  children,
  as = 'h2',
  colour = 'foreground',
  className = '',
}) => {
  const colourClass = COLOUR_CLASS_MAP[colour];
  const sizeClass = SIZE_MAP[as];
  const weightClass = 'font-bold';

  const classes = `${colourClass} ${sizeClass} ${weightClass} ${className}`.trim();

  const Component = as;

  return <Component className={classes}>{children}</Component>;
};
