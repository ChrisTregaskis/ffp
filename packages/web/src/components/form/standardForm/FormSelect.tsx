// Design reference: https://carbondesignsystem.com/components/dropdown/usage/
// For when we look to align new inputs or current ones

import { useController } from 'react-hook-form';

import { Icon, Icons, Text } from '@web/components/atoms';
import { BaseSelect } from '@web/components/molecules';
import type { SelectOption } from '@web/components/molecules';

import { getFieldDescriptionIds } from '../shared/fieldDescription';
import { getFieldErrorMessage } from '../shared/fieldError';
import { getInputClassName } from '../shared/inputStyles';

import { FormField } from './FormField';

import type { Control, FieldErrors, FieldValues, Path, RegisterOptions } from 'react-hook-form';

export type { SelectOption };

export interface FormSelectProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  isRequired?: boolean;
  /** Short guidance shown under the select */
  hint?: string;
  /** Validation rules, as `registerOptions` is on the register-based inputs */
  rules?: Omit<RegisterOptions<TFieldValues, Path<TFieldValues>>, 'valueAsNumber' | 'valueAsDate'>;
}

/**
 * Custom dropdown select component for standard forms.
 *
 * Replaces native `<select>` with a fully accessible custom dropdown.
 *
 * `isRequired` only marks the field; pass `rules` to make it refuse an empty value.
 */
export const FormSelect = <TFieldValues extends FieldValues>({
  name,
  label,
  options,
  placeholder,
  control,
  errors,
  isRequired,
  hint,
  rules,
}: FormSelectProps<TFieldValues>): JSX.Element => {
  const error = getFieldErrorMessage(errors, name);
  const inputId = String(name);
  const { hintId, errorId, describedBy } = getFieldDescriptionIds(inputId, { hint, error });

  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
    rules,
    defaultValue: '' as TFieldValues[Path<TFieldValues>],
  });

  return (
    <FormField
      htmlFor={inputId}
      label={label}
      isRequired={isRequired}
      hint={hint}
      hintId={hintId}
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
            aria-describedby={describedBy}
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
