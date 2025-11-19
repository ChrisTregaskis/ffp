import { motion } from 'motion/react';

import type { ReactNode } from 'react';

export interface SpringScaleProps {
  /** Content to animate */
  children: ReactNode;
  /** Initial scale value @default 0.8 */
  initialScale?: number;
  /** Spring stiffness (higher = snappier) @default 260 */
  stiffness?: number;
  /** Spring damping (higher = less bouncy) @default 20 */
  damping?: number;
  /** Additional custom classes */
  className?: string;
}

/**
 * Spring-based scale animation wrapper.
 *
 * Animates content with a scale effect using spring physics for natural motion.
 * The spring creates a subtle bounce effect that feels more organic than linear animations.
 *
 */
export const SpringScale: React.FC<SpringScaleProps> = ({
  children,
  initialScale = 0.8,
  stiffness = 260,
  damping = 20,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: initialScale }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness,
        damping,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
