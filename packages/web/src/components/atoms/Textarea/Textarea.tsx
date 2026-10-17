import React from 'react';

import { getInputClassName, LOCKED_INPUT_CLASSES } from '@web/utils/input-styles';

import type { InputAppearance } from '../Input';
import type { Ref, TextareaHTMLAttributes } from 'react';

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  /** Shows the error border */
  hasError?: boolean;
  /** @default 'field' */
  appearance?: InputAppearance;
  /** Classes added after the field classes */
  className?: string;
  /** Reaches the `<textarea>`, e.g. the `ref` from react-hook-form's `register` */
  forwardedRef?: Ref<HTMLTextAreaElement>;
}

/** Multi-line text entry. The only place a `<textarea>` renders; compose it rather than restyling one. */
export const Textarea: React.FC<TextareaProps> = ({
  hasError = false,
  appearance = 'field',
  className,
  forwardedRef,
  ...rest
}) => {
  const isLocked = rest.disabled === true || rest.readOnly === true;
  const fieldClasses =
    appearance === 'field'
      ? `${getInputClassName(hasError)} w-full px-3 py-2 resize-y${isLocked ? ` ${LOCKED_INPUT_CLASSES}` : ''}`
      : '';

  return (
    <textarea
      ref={forwardedRef}
      className={`${fieldClasses} ${className ?? ''}`.trim()}
      {...rest}
    />
  );
};
