import { getInputClassName } from '@web/components/form/shared/inputStyles';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { Text } from '@web/components/text';

import { BaseSelect } from './BaseSelect';

import type { SelectOption } from './types';

export type { SelectOption };

export interface SelectProps {
  /** Current value */
  value: string | number;
  /** Change handler */
  onChange: (value: string | number) => void;
  /** Available options */
  options: SelectOption[];
  /** Accessible label */
  ariaLabel: string;
  /** Placeholder text shown when no option matches the current value */
  placeholder?: string;
  /** Additional classes on the outer wrapper */
  className?: string;
}

/**
 * Standalone custom dropdown select.
 *
 * Same visual style as FormSelect but without React Hook Form dependency.
 * Use for standalone controls like table pagination page-size selectors.
 */
export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder,
  className,
}) => (
  <BaseSelect
    value={value}
    onChange={onChange}
    options={options}
    listboxAriaLabel={ariaLabel}
    className={className}
    renderTrigger={({ isOpen, selectedOption, onToggle, onKeyDown, listboxId }) => (
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={ariaLabel}
        onClick={onToggle}
        onKeyDown={onKeyDown}
        className={`${getInputClassName(false, 'input', true)} flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-left text-sm`}
      >
        <Text
          styleProps={{
            size: 'sm',
            ...(!(selectedOption != null) && placeholder ? { colour: 'muted-foreground' } : {}),
          }}
        >
          {selectedOption?.label ?? placeholder ?? String(value)}
        </Text>
        <Icon
          name={Icons.CHEVRONDOWN}
          styleProps={{ size: 'sm', colour: 'var(--color-muted-foreground)' }}
        />
      </button>
    )}
  />
);
