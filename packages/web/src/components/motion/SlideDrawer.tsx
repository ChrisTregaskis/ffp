import { motion } from 'motion/react';
import React, { useMemo, type PropsWithChildren } from 'react';

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';

export interface SlideDrawerProps extends PropsWithChildren {
  // Position from which the drawer slides in
  position?: DrawerPosition;
  // Duration of the slide animation in seconds
  duration?: number;
  // Easing function for the transition
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  // Additional CSS classes
  className?: string;
}

/**
 * SlideDrawer motion component for slide-in panels and drawers.
 * !Designed to be used with AnimatePresence from Framer Motion.
 */
export const SlideDrawer: React.FC<SlideDrawerProps> = ({
  children,
  position = 'right',
  duration = 0.3,
  easing = 'easeInOut',
  className = '',
}) => {
  // Calculate initial and exit positions based on drawer position
  const animationProps = useMemo((): {
    initial: { x: string } | { y: string };
    animate: { x: number } | { y: number };
    exit: { x: string } | { y: string };
  } => {
    switch (position) {
      case 'left':
        return { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } };
      case 'right':
        return { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };
      case 'top':
        return { initial: { y: '-100%' }, animate: { y: 0 }, exit: { y: '-100%' } };
      case 'bottom':
        return { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };
      default:
        return { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };
    }
  }, [position]);

  return (
    <motion.aside
      initial={animationProps.initial}
      animate={animationProps.animate}
      exit={animationProps.exit}
      transition={{ duration, ease: easing }}
      className={className}
    >
      {children}
    </motion.aside>
  );
};
