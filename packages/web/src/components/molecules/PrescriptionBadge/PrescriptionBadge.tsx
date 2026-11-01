import { Badge } from '@web/components/atoms';
import type { BadgeAppearance, BadgeProps, BadgeVariant, IconName } from '@web/components/atoms';

export type PrescriptionBadgeVariant = 'blue' | 'purple' | 'green';
export type PrescriptionBadgeSize = 'sm' | 'md';

export interface PrescriptionBadgeProps {
  /** Badge label (e.g., "3 sets × 12", "Rest 30s") */
  label: string;
  icon: IconName;
  /** @default 'blue' */
  variant?: PrescriptionBadgeVariant;
  /** `sm` for compact dashboard cards, `md` for the session screens @default 'md' */
  size?: PrescriptionBadgeSize;
}

const VARIANT_MAP: Record<
  PrescriptionBadgeVariant,
  { variant: BadgeVariant; appearance: BadgeAppearance }
> = {
  blue: { variant: 'brand', appearance: 'solid' },
  purple: { variant: 'brand', appearance: 'soft' },
  green: { variant: 'success', appearance: 'solid' },
};

const SIZE_MAP: Record<PrescriptionBadgeSize, Pick<BadgeProps, 'size' | 'shape'>> = {
  sm: { size: 'sm', shape: 'md' },
  md: { size: 'md', shape: 'lg' },
};

/** An exercise's prescription (sets and reps, rest, duration) as an icon pill. */
export const PrescriptionBadge: React.FC<PrescriptionBadgeProps> = ({
  label,
  icon,
  variant = 'blue',
  size = 'md',
}) => <Badge label={label} icon={icon} {...VARIANT_MAP[variant]} {...SIZE_MAP[size]} />;
