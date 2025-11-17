import { motion } from 'motion/react';

import type { ReactNode } from 'react';

export interface ClickScaleProps {
  /** Content to animate (typically a Button) */
  children: ReactNode;
  /** Scale value when pressed @default 0.95 */
  scale?: number;
  /** Animation duration in seconds @default 0.1 */
  duration?: number;
  /** Additional custom classes */
  className?: string;
}

/**
 * Click/tap scale animation wrapper.
 *
 * Provides a subtle scale-down effect when clicked, similar to a physical keyboard key.
 * Creates a tactile, responsive feel for interactive elements.
 *
 * Typically used to wrap Button components for click feedback.
 */
export const ClickScale: React.FC<ClickScaleProps> = ({
  children,
  scale = 0.97,
  duration = 0.1,
  className = '',
}) => {
  return (
    <motion.div whileTap={{ scale }} transition={{ duration }} className={className}>
      {children}
    </motion.div>
  );
};
