import { IconButton } from '@web/components/button/IconButton';
import { Icon, type IconColour } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';

import { Text, type TextColour } from '../text';

export type AlertVariant = 'error' | 'warning' | 'success';
export type AlertAppearance = 'soft' | 'solid';

export interface StaticAlertProps {
  /** Alert variant determining colour and icon */
  variant?: AlertVariant;
  /** Visual appearance @default 'soft' */
  appearance?: AlertAppearance;
  /** Alert message to display */
  message: string;
  /** Optional callback to clear/dismiss the alert */
  onDismiss?: () => void;
  /** Additional custom classes */
  className?: string;
}

/** Appearance-specific styling for a given variant */
interface AlertStyleConfig {
  bg: string;
  border: string;
  iconColour: IconColour;
  /** Text colour via Text styleProps */
  textColour: TextColour;
  /** Classes applied to the dismiss button */
  dismissClass: string;
}

/**
 * Variant + appearance configuration for StaticAlert.
 *
 * Soft: translucent tinted background with coloured text.
 * Solid: full-colour background with white text and icon.
 */
const VARIANT_CONFIG: Record<
  AlertVariant,
  { icon: Icons; soft: AlertStyleConfig; solid: AlertStyleConfig }
> = {
  error: {
    icon: Icons.ALERTCIRCLE,
    soft: {
      bg: 'bg-destructive/20',
      border: 'border-destructive/40',
      iconColour: 'var(--color-destructive)',
      textColour: 'destructive',
      dismissClass: 'opacity-60 hover:opacity-100',
    },
    solid: {
      bg: 'bg-destructive',
      border: 'border-destructive',
      iconColour: '#ffffff',
      textColour: 'white',
      dismissClass: 'opacity-80 hover:opacity-100',
    },
  },
  warning: {
    icon: Icons.ALERTTRIANGLE,
    soft: {
      bg: 'bg-warning/20',
      border: 'border-warning/40',
      iconColour: 'var(--color-warning)',
      textColour: 'warning',
      dismissClass: 'opacity-60 hover:opacity-100',
    },
    solid: {
      bg: 'bg-warning',
      border: 'border-warning',
      iconColour: '#ffffff',
      textColour: 'white',
      dismissClass: 'opacity-80 hover:opacity-100',
    },
  },
  success: {
    icon: Icons.CHECKCIRCLE,
    soft: {
      bg: 'bg-success/20',
      border: 'border-success/40',
      iconColour: 'var(--color-success)',
      textColour: 'success',
      dismissClass: 'opacity-60 hover:opacity-100',
    },
    solid: {
      bg: 'bg-success',
      border: 'border-success',
      iconColour: '#ffffff',
      textColour: 'white',
      dismissClass: 'opacity-80 hover:opacity-100',
    },
  },
};

/**
 * Static alert component with variants and appearances.
 *
 * Displays contextual alerts in a consistent styled box.
 * Supports soft (translucent tint) and solid (full-colour) appearances.
 */
export const StaticAlert: React.FC<StaticAlertProps> = ({
  variant = 'error',
  appearance = 'soft',
  message,
  onDismiss,
  className = '',
}) => {
  const { icon } = VARIANT_CONFIG[variant];
  const styles = VARIANT_CONFIG[variant][appearance];

  return (
    <div
      role="alert"
      className={`w-full rounded-md border ${styles.bg} ${styles.border} p-4 ${className}`.trim()}
    >
      <div className="flex items-center justify-center">
        <Icon name={icon} styleProps={{ size: 'sm', colour: styles.iconColour }} />
        <Text as="p" styleProps={{ colour: styles.textColour }} className="ml-3 flex-1">
          {message}
        </Text>
        {onDismiss && (
          <IconButton
            icon={Icons.CLOSE}
            size="md"
            ariaLabel="Dismiss alert"
            onClick={onDismiss}
            className={`ml-auto ${styles.dismissClass}`}
          />
        )}
      </div>
    </div>
  );
};
