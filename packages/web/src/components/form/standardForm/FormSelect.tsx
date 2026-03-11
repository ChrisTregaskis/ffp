// Design reference: https://carbondesignsystem.com/components/dropdown/usage/
// For when we look to align new inputs or current ones

import { useController } from 'react-hook-form';

import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { BaseSelect } from '@web/components/select/BaseSelect';
import type { SelectOption } from '@web/components/select/types';
import { Text } from '@web/components/text';

import { getInputClassName } from '../shared/inputStyles';

import { FormField } from './FormField';

import type { Control, FieldErrors, FieldValues, Path } from 'react-hook-form';

export type { SelectOption };

export interface FormSelectProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  isRequired?: boolean;
}

/**
 * Custom dropdown select component for standard forms.
 *
 * Replaces native `<select>` with a fully accessible custom dropdown.
 */
export const FormSelect = <TFieldValues extends FieldValues>({
  name,
  label,
  options,
  placeholder,
  control,
  errors,
  isRequired,
}: FormSelectProps<TFieldValues>): JSX.Element => {
  const error = errors[name]?.message as string | undefined;
  const inputId = String(name);
  const errorId = `${inputId}-error`;

  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
    defaultValue: '' as TFieldValues[Path<TFieldValues>],
  });

  return (
    <FormField
      htmlFor={inputId}
      label={label}
      isRequired={isRequired}
      error={error}
      errorId={errorId}
    >
      <BaseSelect
        value={value as string | number}
        onChange={(val) => {
          onChange(val as TFieldValues[Path<TFieldValues>]);
        }}
        options={options}
        listboxAriaLabel={label}
        renderTrigger={({ isOpen, selectedOption, onToggle, onKeyDown, listboxId }) => (
          <button
            id={inputId}
            type="button"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={isOpen ? listboxId : undefined}
            aria-required={isRequired}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            onClick={onToggle}
            onKeyDown={onKeyDown}
            className={`${getInputClassName(!!error)} flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left`}
          >
            {selectedOption ? (
              <Text>{selectedOption.label}</Text>
            ) : (
              <Text styleProps={{ colour: 'muted-foreground' }}>{placeholder ?? 'Select...'}</Text>
            )}
            <Icon
              name={Icons.CHEVRONDOWN}
              styleProps={{ size: 'sm', colour: 'var(--color-muted-foreground)' }}
            />
          </button>
        )}
      />
    </FormField>
  );
};
