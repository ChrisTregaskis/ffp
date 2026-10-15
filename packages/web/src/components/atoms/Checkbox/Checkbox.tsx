import React from 'react';

import type { InputHTMLAttributes, Ref } from 'react';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  /** Reaches the `<input>`, e.g. the `ref` from react-hook-form's `register` */
  forwardedRef?: Ref<HTMLInputElement>;
}

/**
 * A native checkbox. The only place one renders.
 *
 * It carries no text: name it with `Label` (`variant="option"` wraps it via `control`) or `aria-label`.
 */
export const Checkbox: React.FC<CheckboxProps> = ({ forwardedRef, ...rest }) => (
  <input
    ref={forwardedRef}
    type="checkbox"
    className="h-4 w-4 rounded border-muted-foreground text-primary focus:ring-primary"
    {...rest}
  />
);
