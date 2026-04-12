type StatusBadgeVariant = 'current' | 'completed' | 'upcoming' | 'in-progress';

export interface StatusBadgeProps {
  /** Badge label text */
  label: string;
  /** Visual variant */
  variant?: StatusBadgeVariant;
}

const VARIANT_CLASSES: Record<StatusBadgeVariant, string> = {
  current: 'bg-ffp-dark-blue text-white',
  'in-progress': 'bg-ffp-dark-blue text-white',
  completed: 'bg-ffp-green text-white',
  upcoming: 'bg-muted text-muted-foreground',
};

/**
 * Status badge for programme phases, sessions, and exercises.
 *
 * Small pill-style label indicating current state.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant = 'current' }) => (
  <span
    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${VARIANT_CLASSES[variant]}`}
  >
    {label}
  </span>
);
