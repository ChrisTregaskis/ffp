import React from 'react';

import type { InputHTMLAttributes, Ref } from 'react';

/** `choice` is the larger, bordered control a member's answer options use */
export type RadioVariant = 'default' | 'choice';

const VARIANT_CLASSES: Record<RadioVariant, string> = {
  default: 'h-4 w-4 border-muted-foreground text-primary focus:ring-primary',
  choice:
    'h-5 w-5 rounded-full border-2 border-border bg-card appearance-none transition-all duration-200 checked:border-primary checked:bg-primary checked:shadow-radio-dot focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed',
};

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  /** @default 'default' */
  variant?: RadioVariant;
  /** Reaches the `<input>`, e.g. the `ref` from react-hook-form's `register` */
  forwardedRef?: Ref<HTMLInputElement>;
}

/**
 * A native radio button. The only place one renders.
 *
 * It carries no text: name it with `Label` (`variant="option"` wraps it via `control`) or `aria-label`.
 * Radios sharing a `name` form one group.
 */
export const Radio: React.FC<RadioProps> = ({ variant = 'default', forwardedRef, ...rest }) => (
  <input ref={forwardedRef} type="radio" className={VARIANT_CLASSES[variant]} {...rest} />
);
