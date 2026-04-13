import { AnimatePresence, motion } from 'motion/react';

import type { ReactNode } from 'react';

export interface ExpandableSectionProps {
  /** Whether the section is visible */
  isVisible: boolean;
  /** Whether to skip the initial height animation (true for first phase) */
  skipInitialAnimation?: boolean;
  /** Animation duration in seconds @default 0.4 */
  duration?: number;
  /** Animation delay in seconds @default 0.3 */
  delay?: number;
  /** Content to reveal */
  children: ReactNode;
}

/**
 * Expandable section that animates height from 0 to auto with fade.
 *
 * Wraps AnimatePresence + motion.div for height reveal animations
 * used within phase timeline cards.
 */
export const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  isVisible,
  skipInitialAnimation = false,
  duration = 0.4,
  delay = 0.3,
  children,
}) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={skipInitialAnimation ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        transition={{ duration, ease: 'easeOut', delay }}
        className="overflow-hidden"
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);
