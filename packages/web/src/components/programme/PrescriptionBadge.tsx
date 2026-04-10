import { Icon } from '@web/components/Icon/Icon';
import type { IconName } from '@web/components/Icon/types';

type PrescriptionBadgeVariant = 'blue' | 'purple' | 'green';
type PrescriptionBadgeSize = 'sm' | 'md';

export interface PrescriptionBadgeProps {
  /** Badge label (e.g., "3 sets x 12", "30s rest") */
  label: string;
  /** Icon to display */
  icon: IconName;
  /** Colour variant */
  variant?: PrescriptionBadgeVariant;
  /** Size variant — sm for compact (dashboard cards), md for full (session page) */
  size?: PrescriptionBadgeSize;
}

const VARIANT_CLASSES: Record<PrescriptionBadgeVariant, string> = {
  blue: 'bg-ffp-dark-blue text-white',
  purple: 'bg-ffp-light-purple text-ffp-dark-blue',
  green: 'bg-ffp-green text-white',
};

const SIZE_CLASSES: Record<PrescriptionBadgeSize, string> = {
  sm: 'gap-1 rounded-md px-2 py-1 text-xs',
  md: 'gap-2 rounded-lg px-3.5 py-2 text-sm',
};

/**
 * Prescription badge for exercise details.
 *
 * Displays sets/reps, rest time, or duration with an icon
 * in a solid colour pill.
 */
export const PrescriptionBadge: React.FC<PrescriptionBadgeProps> = ({
  label,
  icon,
  variant = 'blue',
  size = 'md',
}) => {
  const iconColour = variant === 'purple' ? 'var(--color-ffp-dark-blue)' : '#ffffff';
  const iconSize = size === 'sm' ? 'xs' : 'sm';

  return (
    <span
      className={`inline-flex items-center font-medium ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]}`}
    >
      <Icon name={icon} styleProps={{ size: iconSize, colour: iconColour }} />
      {label}
    </span>
  );
};
