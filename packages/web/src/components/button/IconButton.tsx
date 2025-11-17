import { Icon, type IconColour, type IconSize } from '@web/components/Icon/Icon';
import type { IconName } from '@web/components/Icon/types';

export interface IconButtonProps {
  /** Icon to display */
  icon: IconName;
  /** Size of the icon @default 'md' */
  size?: IconSize;
  /** Colour of the icon @default 'currentColor' */
  colour?: IconColour;
  /** Click handler */
  onClick?: () => void;
  /** Accessible label for screen readers */
  ariaLabel: string;
  /** Button type @default 'button' */
  type?: 'button' | 'submit' | 'reset';
  /** Disabled state */
  disabled?: boolean;
  /** Additional custom classes */
  className?: string;
}

/**
 * Icon button component - a clickable icon.
 *
 * Renders a semantic button element with an icon inside.
 * Use for icon-only actions like close, delete, edit, etc.
 *
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  colour = 'currentColor',
  onClick,
  ariaLabel,
  type = 'button',
  disabled = false,
  className = '',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center transition-opacity hover:opacity-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${className}`.trim()}
    >
      <Icon name={icon} styleProps={{ size, colour }} />
    </button>
  );
};
