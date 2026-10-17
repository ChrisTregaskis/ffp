import { SelectTrigger } from '@web/components/atoms';

import { BaseSelect } from '../BaseSelect';

import type { SelectOption } from '../BaseSelect';

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
      <SelectTrigger
        size="sm"
        isOpen={isOpen}
        listboxId={listboxId}
        isPlaceholder={selectedOption == null && !!placeholder}
        aria-label={ariaLabel}
        onClick={onToggle}
        onKeyDown={onKeyDown}
      >
        {selectedOption?.label ?? placeholder ?? String(value)}
      </SelectTrigger>
    )}
  />
);
