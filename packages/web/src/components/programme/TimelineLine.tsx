import { motion } from 'motion/react';

export interface TimelineLineProps {
  /** CSS colour class for the line (e.g. 'bg-ffp-green') */
  colourClassName: string;
  /** Whether to skip the initial scaleY animation (true for first phase) */
  skipInitialAnimation?: boolean;
  /** Whether the line is expanded */
  isExpanded: boolean;
}

/**
 * Animated vertical connecting line between timeline nodes.
 *
 * Scales from top (origin-top) when the phase scrolls into view.
 */
export const TimelineLine: React.FC<TimelineLineProps> = ({
  colourClassName,
  skipInitialAnimation = false,
  isExpanded,
}) => (
  <motion.div
    className={`w-0.5 flex-1 origin-top ${colourClassName}`}
    initial={{ scaleY: skipInitialAnimation ? 1 : 0 }}
    animate={isExpanded ? { scaleY: 1 } : { scaleY: 0 }}
    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
  />
);
