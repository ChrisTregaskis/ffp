import { ProgressBar, Text } from '@web/components/atoms';

export interface ProgressSummaryProps {
  /** Eyebrow label on the left; also names the progress bar */
  label: string;
  /** Count on the right, e.g. "2 of 3 sessions" */
  count: string;
  /** Progress percentage (0–100) */
  percent: number;
  /** Override the track background colour @default 'bg-muted' */
  trackClassName?: string;
  className?: string;
}

/** An eyebrow label and a count above a progress bar. */
export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  label,
  count,
  percent,
  trackClassName,
  className,
}) => (
  <div className={className}>
    <div className="mb-2 flex items-center justify-between">
      <Text variant="eyebrow">{label}</Text>
      <Text styleProps={{ size: 'sm', weight: 'medium' }}>{count}</Text>
    </div>
    <ProgressBar percent={percent} trackClassName={trackClassName} aria-label={label} />
  </div>
);
