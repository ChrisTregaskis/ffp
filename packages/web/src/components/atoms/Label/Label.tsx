import React from 'react';

import { RequiredIndicator } from '../RequiredIndicator';
import { Text, type TextStyleProps } from '../Text';

import type { LabelHTMLAttributes, ReactNode } from 'react';

/**
 * `field` names a control placed below it; `option` sits beside the checkbox or radio it wraps;
 * `choice` is `option` at a member's answer-option size.
 */
export type LabelVariant = 'field' | 'option' | 'choice';

const TEXT_STYLES: Record<LabelVariant, TextStyleProps> = {
  field: { size: 'sm', weight: 'medium', colour: 'muted-foreground' },
  option: { size: 'sm', colour: 'foreground' },
  choice: { size: 'base', colour: 'foreground' },
};

export interface LabelProps
  extends Omit<LabelHTMLAttributes<HTMLLabelElement>, 'className' | 'children'> {
  /** The label text */
  children: ReactNode;
  /** @default 'field' */
  variant?: LabelVariant;
  /** Adds the required marker after the text */
  isRequired?: boolean;
  /** A control the label wraps, rendered before the text (a checkbox or radio) */
  control?: ReactNode;
  /** Layout classes for the `<label>`, or a card's look when the whole label is the hit area */
  className?: string;
}

/** Names a form control. The only place a `<label>` renders. */
export const Label: React.FC<LabelProps> = ({
  children,
  variant = 'field',
  isRequired = false,
  control,
  className,
  ...rest
}) => (
  <label className={className} {...rest}>
    {control}
    <Text styleProps={TEXT_STYLES[variant]}>{children}</Text>
    {isRequired && <RequiredIndicator />}
  </label>
);
