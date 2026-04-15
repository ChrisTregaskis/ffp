import { motion } from 'motion/react';

import type { ReactNode } from 'react';

export interface FadeSlideProps {
  /** Content to animate */
  children: ReactNode;
  /** Animation duration in seconds @default 0.3 */
  duration?: number;
  /** Distance to slide from/to (in pixels) @default 10 */
  slideDistance?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Fade and slide animation wrapper with enter and exit animations.
 *
 * Slides up on enter, slides up on exit (opposite direction).
 * Designed for use inside AnimatePresence for content swaps.
 */
export const FadeSlide: React.FC<FadeSlideProps> = ({
  children,
  duration = 0.3,
  slideDistance = 10,
  className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, y: slideDistance }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -slideDistance }}
    transition={{ duration }}
    className={className}
  >
    {children}
  </motion.div>
);
