import { motion } from 'motion/react';

import type { ReactNode } from 'react';

export interface ScaleFadeProps {
  /** Content to animate */
  children: ReactNode;
  /** Initial scale value @default 0.95 */
  initialScale?: number;
  /** Animation duration in seconds @default 0.15 */
  duration?: number;
  /** Easing function @default 'easeOut' */
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  /** Additional custom classes */
  className?: string;
}

/**
 * Scale and fade animation wrapper with exit animation.
 *
 * Designed for quick, subtle animations like tooltips and popovers.
 * Uses standard easing for predictable, snappy transitions.
 */
export const ScaleFade: React.FC<ScaleFadeProps> = ({
  children,
  initialScale = 0.95,
  duration = 0.15,
  easing = 'easeOut',
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: initialScale }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: initialScale }}
      transition={{ duration, ease: easing }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
