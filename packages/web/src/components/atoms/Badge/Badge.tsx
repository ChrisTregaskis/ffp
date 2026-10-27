import React from 'react';

import { Icon } from '../Icon';

import type { IconName, IconSize } from '../Icon';
import type { HTMLAttributes } from 'react';

export type BadgeVariant =
  | 'brand'
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'muted';
/** `solid` filled with light text · `soft` a tint with the variant's text colour */
export type BadgeAppearance = 'solid' | 'soft';
/** `xs` table and list pills · `sm` card pills · `md` session-screen pills */
export type BadgeSize = 'xs' | 'sm' | 'md';
export type BadgeShape = 'full' | 'md' | 'lg';

const VARIANT_CLASSES: Record<BadgeVariant, Record<BadgeAppearance, string>> = {
  brand: { solid: 'bg-ffp-dark-blue text-white', soft: 'bg-ffp-light-purple text-ffp-dark-blue' },
  primary: { solid: 'bg-primary text-white', soft: 'bg-primary/10 text-primary' },
  success: { solid: 'bg-success text-white', soft: 'bg-success/10 text-success' },
  warning: { solid: 'bg-warning text-white', soft: 'bg-warning/10 text-warning' },
  destructive: { solid: 'bg-destructive text-white', soft: 'bg-destructive/10 text-destructive' },
  info: { solid: 'bg-info text-white', soft: 'bg-info/10 text-info' },
  muted: { solid: 'bg-muted-foreground text-white', soft: 'bg-muted text-muted-foreground' },
};

// A fully rounded pill takes half a step more side padding than a rounded rectangle.
const SIZE_STYLES: Record<
  BadgeSize,
  { classes: string; paddingX: string; fullPaddingX: string; icon: IconSize }
> = {
  xs: { classes: 'gap-1 py-0.5 text-xs', paddingX: 'px-2', fullPaddingX: 'px-2.5', icon: 'xs' },
  sm: { classes: 'gap-1 py-1 text-xs', paddingX: 'px-2', fullPaddingX: 'px-2.5', icon: 'xs' },
  md: { classes: 'gap-2 py-2 text-sm', paddingX: 'px-3.5', fullPaddingX: 'px-4', icon: 'sm' },
};

const SHAPE_CLASSES: Record<BadgeShape, string> = {
  full: 'rounded-full',
  md: 'rounded-md',
  lg: 'rounded-lg',
};

export interface BadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'children'> {
  label: string;
  /** Leading icon, coloured like the label */
  icon?: IconName;
  /** @default 'muted' */
  variant?: BadgeVariant;
  /** @default 'soft' */
  appearance?: BadgeAppearance;
  /** @default 'xs' */
  size?: BadgeSize;
  /** @default 'full' */
  shape?: BadgeShape;
}

/** A short label in a coloured pill: a status, a tag, a count. */
export const Badge: React.FC<BadgeProps> = ({
  label,
  icon,
  variant = 'muted',
  appearance = 'soft',
  size = 'xs',
  shape = 'full',
  ...rest
}) => {
  const style = SIZE_STYLES[size];
  const paddingX = shape === 'full' ? style.fullPaddingX : style.paddingX;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap font-medium ${style.classes} ${paddingX} ${SHAPE_CLASSES[shape]} ${VARIANT_CLASSES[variant][appearance]}`}
      {...rest}
    >
      {icon && <Icon name={icon} styleProps={{ size: style.icon }} />}
      {label}
    </span>
  );
};
