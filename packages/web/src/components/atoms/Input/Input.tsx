import React from 'react';

import { getInputClassName, LOCKED_INPUT_CLASSES } from '@web/utils/input-styles';

import type { InputHTMLAttributes, Ref } from 'react';

export type InputSize = 'md' | 'sm';

/** `bare` drops the field chrome so the consumer's `className` styles the input alone */
export type InputAppearance = 'field' | 'bare';

const SIZE_CLASSES: Record<InputSize, string> = {
  md: 'px-3 py-2',
  sm: 'px-3 py-1.5 text-sm',
};

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'size'> {
  /** Shows the error border */
  hasError?: boolean;
  /** @default 'md' */
  size?: InputSize;
  /** @default 'field' */
  appearance?: InputAppearance;
  /** Classes added after the field classes */
  className?: string;
  /** Reaches the `<input>`, e.g. the `ref` from react-hook-form's `register` */
  forwardedRef?: Ref<HTMLInputElement>;
}

/** Single-line text entry. The only place a text-like `<input>` renders; compose it rather than restyling one. */
export const Input: React.FC<InputProps> = ({
  hasError = false,
  size = 'md',
  appearance = 'field',
  className,
  forwardedRef,
  type = 'text',
  ...rest
}) => {
  const isLocked = rest.disabled === true || rest.readOnly === true;
  const fieldClasses =
    appearance === 'field'
      ? `${getInputClassName(hasError, 'input', size === 'sm')} w-full ${SIZE_CLASSES[size]}${isLocked ? ` ${LOCKED_INPUT_CLASSES}` : ''}`
      : '';

  return (
    <input
      ref={forwardedRef}
      type={type}
      className={`${fieldClasses} ${className ?? ''}`.trim()}
      {...rest}
    />
  );
};
