import { motion } from 'motion/react';
import React from 'react';

export interface BackdropProps {
  // Click handler for backdrop (typically closes the associated component)
  onClick?: () => void;
  // Opacity of the backdrop @default 0.5
  opacity?: number;
  // Duration of fade animation in seconds @default 0.2
  duration?: number;
  // Z-index for stacking context @default 40
  zIndex?: number;
  // Additional CSS classes
  className?: string;
}

/**
 * Backdrop/Overlay component for modals, drawers, and dropdowns.
 *
 * Provides a semi-transparent overlay that:
 * - Fades in/out smoothly
 * - Blocks interaction with content behind it
 * - Can be clicked to dismiss the associated component
 *
 * Designed to be used with AnimatePresence from Framer Motion.
 *
 */
export const Backdrop: React.FC<BackdropProps> = ({
  onClick,
  opacity = 0.5,
  duration = 0.2,
  zIndex = 40,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      exit={{ opacity: 0 }}
      transition={{ duration }}
      className={`fixed inset-0 bg-black ${className}`}
      style={{ zIndex }}
      onClick={onClick}
      aria-hidden="true"
    />
  );
};
