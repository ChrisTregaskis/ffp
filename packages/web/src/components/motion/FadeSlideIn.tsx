import { motion } from 'motion/react';

import type { ReactNode } from 'react';

export interface FadeSlideInProps {
  /** Content to animate */
  children: ReactNode;
  /** Animation delay in seconds @default 0 */
  delay?: number;
  /** Animation duration in seconds @default 0.5 */
  duration?: number;
  /** Distance to slide from (in pixels) @default 20 */
  slideDistance?: number;
  /** Additional custom classes */
  className?: string;
}

/**
 * Fade and slide in animation wrapper.
 *
 * Animates content with a fade-in effect whilst sliding up from below.
 * Useful for staggered animations by providing different delay values.
 *
 */
export function FadeSlideIn({
  children,
  delay = 0,
  duration = 0.5,
  slideDistance = 20,
  className = '',
}: FadeSlideInProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: slideDistance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
