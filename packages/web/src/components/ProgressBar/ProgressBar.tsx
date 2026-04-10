import { motion } from 'motion/react';

export interface ProgressBarProps {
  /** Progress percentage (0–100) */
  percent: number;
  /** Additional CSS classes for the track container */
  className?: string;
}

/**
 * Animated progress bar with gradient fill.
 *
 * Uses a gradient from theme colours.
 * Width animates from 0 to the target percentage on mount.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({ percent, className = '' }) => {
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
        initial={{ width: 0 }}
        animate={{ width: `${String(clampedPercent)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
      />
    </div>
  );
};
