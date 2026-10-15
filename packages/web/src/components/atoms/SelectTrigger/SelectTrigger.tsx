import React from 'react';

import { getInputClassName } from '@web/utils/input-styles';

import { Icon, Icons } from '../Icon';
import { Text, type TextStyleProps } from '../Text';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type SelectTriggerSize = 'md' | 'sm';

const SIZE_CLASSES: Record<SelectTriggerSize, string> = {
  md: 'py-2',
  sm: 'gap-2 py-1.5 text-sm',
};

export interface SelectTriggerProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'type' | 'role' | 'className' | 'children' | 'aria-expanded' | 'aria-haspopup' | 'aria-controls'
  > {
  /** Whether the listbox is showing */
  isOpen: boolean;
  /** Id of the listbox the trigger controls */
  listboxId: string;
  /** The selected option's label, or the placeholder */
  children: ReactNode;
  /** Mutes the text when it is a placeholder rather than a choice */
  isPlaceholder?: boolean;
  /** Shows the error border */
  hasError?: boolean;
  /** @default 'md' */
  size?: SelectTriggerSize;
}

/** The button that opens a select's listbox, chevron included. Render it from `BaseSelect`'s `renderTrigger`. */
export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  isOpen,
  listboxId,
  children,
  isPlaceholder = false,
  hasError = false,
  size = 'md',
  ...rest
}) => {
  const textStyle: TextStyleProps = {
    ...(size === 'sm' ? { size: 'sm' } : {}),
    ...(isPlaceholder ? { colour: 'muted-foreground' } : {}),
  };

  return (
    <button
      {...rest}
      type="button"
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-controls={isOpen ? listboxId : undefined}
      className={`${getInputClassName(hasError, 'input', size === 'sm')} flex w-full cursor-pointer items-center justify-between px-3 text-left ${SIZE_CLASSES[size]}`}
    >
      <Text styleProps={textStyle}>{children}</Text>
      <Icon
        name={Icons.CHEVRONDOWN}
        styleProps={{ size: 'sm', colour: 'var(--color-muted-foreground)' }}
      />
    </button>
  );
};
