import React from 'react';

import { Icon, type IconColour, type IconSize, type IconName } from '../Icon';

import type { MouseEvent } from 'react';

export interface IconButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'type' | 'disabled' | 'className' | 'children' | 'aria-label'
  > {
  /** Icon to display */
  icon: IconName;
  /** Size of the icon @default 'md' */
  size?: IconSize;
  /** Colour of the icon @default 'currentColor' */
  colour?: IconColour;
  /** Click handler */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
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
 * Note: This component uses a raw <button> element as it is a
 * low-level primitive in the component library. Application code
 * should use this component, not raw buttons.
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
  ...rest
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center transition-opacity hover:opacity-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${className}`.trim()}
      {...rest}
    >
      <Icon name={icon} styleProps={{ size, colour }} />
    </button>
  );
};
