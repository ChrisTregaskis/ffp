import React from 'react';

import type { InputHTMLAttributes, Ref } from 'react';

/** `choice` is the larger, bordered control a member's answer options use */
export type CheckboxVariant = 'default' | 'choice';

const VARIANT_CLASSES: Record<CheckboxVariant, string> = {
  default: 'h-4 w-4 rounded border-muted-foreground text-primary focus:ring-primary',
  choice:
    'h-5 w-5 rounded border-2 border-border bg-card appearance-none transition-all duration-200 checked:border-primary checked:bg-primary checked:bg-checkbox-tick focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed',
};

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  /** @default 'default' */
  variant?: CheckboxVariant;
  /** Reaches the `<input>`, e.g. the `ref` from react-hook-form's `register` */
  forwardedRef?: Ref<HTMLInputElement>;
}

/**
 * A native checkbox. The only place one renders.
 *
 * It carries no text: name it with `Label` (`variant="option"` wraps it via `control`) or `aria-label`.
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  variant = 'default',
  forwardedRef,
  ...rest
}) => <input ref={forwardedRef} type="checkbox" className={VARIANT_CLASSES[variant]} {...rest} />;
