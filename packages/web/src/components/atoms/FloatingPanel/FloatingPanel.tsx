import React from 'react';

import type { HTMLAttributes, ReactNode, Ref } from 'react';

const SURFACE_CLASSES =
  'z-50 max-h-60 overflow-auto rounded-md border border-border bg-white shadow-lg';

interface FloatingPanelBaseProps
  extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> {
  /** Panel content */
  children: ReactNode;
  /** Position and size classes */
  className?: string;
}

interface FloatingPanelDivProps extends FloatingPanelBaseProps {
  /** Element to render @default 'div' */
  as?: 'div';
  forwardedRef?: Ref<HTMLDivElement>;
}

interface FloatingPanelListProps extends FloatingPanelBaseProps {
  as: 'ul';
  forwardedRef?: Ref<HTMLUListElement>;
}

export type FloatingPanelProps = FloatingPanelDivProps | FloatingPanelListProps;

/**
 * The surface of a panel that floats over the page: a dropdown list, a menu or a popover.
 *
 * Owns the border, background, shadow, height cap and stacking; the consumer positions it.
 */
export const FloatingPanel: React.FC<FloatingPanelProps> = (props) => {
  const classes = `${SURFACE_CLASSES} ${props.className ?? ''}`.trim();

  if (props.as === 'ul') {
    const { as: _as, forwardedRef, className: _className, children, ...rest } = props;

    return (
      <ul ref={forwardedRef} className={classes} {...rest}>
        {children}
      </ul>
    );
  }

  const { as: _as, forwardedRef, className: _className, children, ...rest } = props;

  return (
    <div ref={forwardedRef} className={classes} {...rest}>
      {children}
    </div>
  );
};
