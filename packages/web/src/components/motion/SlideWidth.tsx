import { motion } from 'motion/react';
import React, { useMemo, type PropsWithChildren } from 'react';

export interface SlideWidthProps extends PropsWithChildren {
  // Whether the component is in collapsed state
  isCollapsed: boolean;
  // Width when expanded (in pixels or Tailwind width class)
  expandedWidth: number | string;
  // Width when collapsed (in pixels or Tailwind width class)
  collapsedWidth: number | string;
  // Duration of the transition in seconds
  duration?: number;
  // Easing function for the transition
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  // Additional CSS classes
  className?: string;
}

/**
 * SlideWidth motion component for animating width changes
 * Used primarily for sidebar collapse/expand functionality
 */
export const SlideWidth: React.FC<SlideWidthProps> = ({
  children,
  isCollapsed,
  expandedWidth,
  collapsedWidth,
  duration = 0.3,
  easing = 'easeInOut',
  className = '',
}) => {
  // Convert width values to appropriate format
  const currentWidth = useMemo((): string => {
    const getWidthValue = (width: number | string): string => {
      if (typeof width === 'number') {
        return `${String(width)}px`;
      }
      return width;
    };

    return isCollapsed ? getWidthValue(collapsedWidth) : getWidthValue(expandedWidth);
  }, [isCollapsed, collapsedWidth, expandedWidth]);

  return (
    <motion.div
      initial={false}
      animate={{
        width: currentWidth,
      }}
      transition={{
        duration,
        ease: easing,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
