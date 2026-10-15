import React from 'react';

import type { HTMLAttributes } from 'react';

/**
 * `plain` bordered box · `elevated` plus a soft shadow · `dashed` dashed border (empty or inline-form areas)
 * · `section`, `tinted`, `gradient` the member screens' panels, with a strong shadow and clipped corners.
 */
export type SurfaceVariant = 'plain' | 'elevated' | 'dashed' | 'section' | 'tinted' | 'gradient';

/** `row` list row · `sm`–`xl` even padding · `bar` a summary strip (wider than tall) */
export type SurfacePadding = 'none' | 'row' | 'sm' | 'md' | 'bar' | 'lg' | 'xl';

export type SurfaceRadius = 'md' | 'lg' | '2xl';

/** `muted` is the lighter border the table and its controls bar use */
export type SurfaceBorder = 'default' | 'muted';

export type SurfaceElement = 'div' | 'section';

const VARIANT_CLASSES: Record<SurfaceVariant, string> = {
  plain: 'border bg-card',
  elevated: 'border bg-card shadow-md',
  dashed: 'border border-dashed bg-card',
  section: 'overflow-hidden border bg-card shadow-xl',
  tinted: 'overflow-hidden bg-secondary/30 shadow-xl',
  gradient: 'overflow-hidden bg-linear-to-br from-secondary/40 to-primary/10 shadow-xl',
};

const DEFAULT_RADIUS: Record<SurfaceVariant, SurfaceRadius> = {
  plain: 'lg',
  elevated: 'lg',
  dashed: 'lg',
  section: '2xl',
  tinted: '2xl',
  gradient: '2xl',
};

const RADIUS_CLASSES: Record<SurfaceRadius, string> = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  '2xl': 'rounded-2xl',
};

const PADDING_CLASSES: Record<SurfacePadding, string> = {
  none: '',
  row: 'px-3 py-2',
  sm: 'p-3',
  md: 'p-4',
  bar: 'px-5 py-4',
  lg: 'p-6',
  xl: 'p-8',
};

const BORDERED: ReadonlySet<SurfaceVariant> = new Set(['plain', 'elevated', 'dashed', 'section']);

const BORDER_CLASSES: Record<SurfaceBorder, string> = {
  default: 'border-border',
  muted: 'border-muted',
};

export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  /** @default 'plain' */
  variant?: SurfaceVariant;
  /** @default 'none' */
  padding?: SurfacePadding;
  /** @default 'lg', or '2xl' for the section, tinted and gradient variants */
  radius?: SurfaceRadius;
  /** Border colour of the bordered variants @default 'default' */
  border?: SurfaceBorder;
  /** @default 'div' */
  as?: SurfaceElement;
}

/** The box every in-page card, panel and list frame sits in. Overlays keep their own chrome. */
export const Surface: React.FC<SurfaceProps> = ({
  variant = 'plain',
  padding = 'none',
  radius,
  border = 'default',
  as: Element = 'div',
  className = '',
  ...rest
}) => {
  const classes = [
    VARIANT_CLASSES[variant],
    BORDERED.has(variant) ? BORDER_CLASSES[border] : '',
    RADIUS_CLASSES[radius ?? DEFAULT_RADIUS[variant]],
    PADDING_CLASSES[padding],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <Element className={classes} {...rest} />;
};
