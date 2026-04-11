import { motion } from 'motion/react';

export interface ProgressBarProps {
  /** Progress percentage (0–100) */
  percent: number;
  /** Additional CSS classes for the track container */
  className?: string;
  /** Animation duration in seconds @default 0.8 */
  duration?: number;
  /** Animation easing @default 'easeOut' */
  ease?: 'easeOut' | 'linear';
  /** Animation delay in seconds @default 0.3 */
  delay?: number;
  /** Whether to animate from 0 on mount @default true */
  animateFromZero?: boolean;
}

/**
 * Animated progress bar with gradient fill.
 *
 * Uses a gradient from theme colours.
 * Supports both mount animation (default) and live updates (for countdowns).
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  className = '',
  duration = 0.8,
  ease = 'easeOut',
  delay = 0.3,
  animateFromZero = true,
}) => {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-muted ${className}`.trim()}
      role="progressbar"
      aria-valuenow={Math.round(clampedPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full rounded-full bg-linear-to-r from-ffp-primary-blue to-ffp-dark-blue"
        initial={animateFromZero ? { width: 0 } : false}
        animate={{ width: `${String(clampedPercent)}%` }}
        transition={{ duration, ease, delay }}
      />
    </div>
  );
};
