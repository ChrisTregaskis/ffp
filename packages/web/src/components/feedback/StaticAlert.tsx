import { IconButton } from '@web/components/button/IconButton';
import { Icon, type IconColour } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';

import { Text, type TextColour } from '../text';

export type AlertVariant = 'error' | 'warning' | 'success';

export interface StaticAlertProps {
  /** Alert variant determining colour and icon */
  variant?: AlertVariant;
  /** Alert message to display */
  message: string;
  /** Optional callback to clear/dismiss the alert */
  onDismiss?: () => void;
  /** Additional custom classes */
  className?: string;
}

/**
 * Variant configuration for StaticAlert
 */
const variantConfig: Record<
  AlertVariant,
  {
    bgColour: string;
    borderColour: string;
    textColour: TextColour;
    iconColour: IconColour;
    dismissHoverColour: string;
    icon: Icons;
  }
> = {
  error: {
    bgColour: 'bg-red-50',
    borderColour: 'border-red-200',
    textColour: 'destructive',
    iconColour: '#dc2626',
    dismissHoverColour: 'hover:text-red-600',
    icon: Icons.ALERTCIRCLE,
  },
  warning: {
    bgColour: 'bg-yellow-50',
    borderColour: 'border-yellow-200',
    textColour: 'warning',
    iconColour: '#ca8a04',
    dismissHoverColour: 'hover:text-yellow-600',
    icon: Icons.ALERTTRIANGLE,
  },
  success: {
    bgColour: 'bg-green-50',
    borderColour: 'border-green-200',
    textColour: 'success',
    iconColour: '#16a34a',
    dismissHoverColour: 'hover:text-green-600',
    icon: Icons.CHECKCIRCLE,
  },
};

/**
 * Static alert component with variants.
 *
 * Displays contextual alerts in a consistent styled box with:
 *
 */
export const StaticAlert: React.FC<StaticAlertProps> = ({
  variant = 'error',
  message,
  onDismiss,
  className = '',
}) => {
  const config = variantConfig[variant];

  return (
    <div
      role="alert"
      className={`w-full rounded-md ${config.bgColour} border ${config.borderColour} p-4 ${className}`.trim()}
    >
      <div className="flex items-center justify-center">
        <Icon name={config.icon} styleProps={{ size: 'sm', colour: config.iconColour }} />
        <Text as="p" styleProps={{ colour: config.textColour }} className="ml-3 flex-1">
          {message}
        </Text>
        {onDismiss && (
          <IconButton
            icon={Icons.CLOSE}
            size="md"
            ariaLabel="Dismiss alert"
            onClick={onDismiss}
            className={`ml-auto ${config.textColour} ${config.dismissHoverColour} opacity-60`}
          />
        )}
      </div>
    </div>
  );
};
