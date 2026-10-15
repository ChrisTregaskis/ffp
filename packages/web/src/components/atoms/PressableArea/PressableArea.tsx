import React from 'react';

import type { ButtonHTMLAttributes } from 'react';

export interface PressableAreaProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Layout and looks: the area carries no chrome of its own */
  className?: string;
}

/**
 * A native `<button>` with no chrome: the focus ring, the pointer and the disabled state only.
 *
 * Use it when a whole row, card or region is the hit area. For a labelled action use `Button`,
 * for an icon-only action `IconButton`.
 */
export const PressableArea: React.FC<PressableAreaProps> = ({
  type = 'button',
  className = '',
  ...rest
}) => (
  <button
    type={type}
    className={`cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
    {...rest}
  />
);
