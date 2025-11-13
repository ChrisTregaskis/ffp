import React from 'react';
import IcomoonReact from 'react-icomoon';

import iconSet from '@web/assets/icomoon/selection.json';

import type { IconName } from './types';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconColour = string; // Hex colour or Tailwind colour class

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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
