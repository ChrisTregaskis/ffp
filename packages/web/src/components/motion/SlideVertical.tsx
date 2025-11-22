import { motion } from 'motion/react';
import React, { type PropsWithChildren } from 'react';

export interface SlideVerticalProps extends PropsWithChildren {
  // Whether the component is visible (animates based on this state)
  isVisible: boolean;
  // Distance to slide (in pixels, negative slides up)
  slideDistance?: number;
  // Duration of the transition in seconds
  duration?: number;
  // Easing function for the transition
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  // Additional CSS classes
  className?: string;
  // Optional ref to forward to the motion.div
  forwardedRef?: React.RefObject<HTMLDivElement>;
}

/**
 * SlideVertical motion component for animating vertical position changes.
 *
 * Used for components that slide in/out vertically based on visibility state,
 * such as sticky headers that hide/show on scroll.
 */
export const SlideVertical: React.FC<SlideVerticalProps> = ({
  children,
  isVisible,
  slideDistance = -100,
  duration = 0.3,
  easing = 'easeInOut',
  className = '',
  forwardedRef,
}) => {
  return (
    <motion.div
      ref={forwardedRef}
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : slideDistance }}
      transition={{ duration, ease: easing }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
