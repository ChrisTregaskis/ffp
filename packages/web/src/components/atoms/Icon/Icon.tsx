import React from 'react';
import IcomoonReact from 'react-icomoon';

import iconSet from '@web/assets/icomoon/selection.json';

import type { IconName } from './types';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Type-safe colour values for icons */
export type IconColour =
  /** CSS named colours (e.g., 'currentColor', 'inherit', 'transparent') */
  | 'currentColor'
  | 'inherit'
  | 'transparent'
  /** Hex colours (e.g., '#3B82F6') */
  | `#${string}`
  /** RGB/RGBA (e.g., 'rgb(59, 130, 246)', 'rgba(59, 130, 246, 0.5)') */
  | `rgb(${string})`
  | `rgba(${string})`
  /** HSL/HSLA (e.g., 'hsl(217, 91%, 60%)') */
  | `hsl(${string})`
  | `hsla(${string})`
  /** CSS variables (e.g., 'var(--color-primary)') */
  | `var(${string})`;

export interface IconStyleProps {
  size?: IconSize;
  colour?: IconColour;
  className?: string;
}

export interface IconProps {
  name: IconName;
  styleProps?: IconStyleProps;
  title?: string;
  ariaLabel?: string;
}

const sizeMap: Record<IconSize, string> = {
  xs: '12px',
  sm: '16px',
  md: '20px',
  lg: '24px',
  xl: '32px',
};

/**
 * Type-safe icon component using Icomoon font
 *
 * @example
 * ```tsx
 * <Icon name={Icons.SEARCH} styleProps={{ size: 'md', colour: '#3B82F6' }} />
 * ```
 */
export const Icon: React.FC<IconProps> = ({ name, styleProps = {}, title, ariaLabel }) => {
  const { size = 'md', colour = 'currentColor', className = '' } = styleProps;

  return (
    <IcomoonReact
      iconSet={iconSet}
      icon={name}
      size={sizeMap[size]}
      color={colour}
      title={title}
      className={className}
      aria-label={ariaLabel}
    />
  );
};
