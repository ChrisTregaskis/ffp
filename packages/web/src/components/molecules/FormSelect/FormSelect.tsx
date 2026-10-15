// Design reference: https://carbondesignsystem.com/components/dropdown/usage/
// For when we look to align new inputs or current ones

import { useController } from 'react-hook-form';

import { SelectTrigger } from '@web/components/atoms';
import { getFieldDescriptionIds } from '@web/utils/field-description';
import { getFieldErrorMessage } from '@web/utils/field-error';

import { BaseSelect, type SelectOption } from '../BaseSelect';
import { FormField } from '../FormField';

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
          <SelectTrigger
            id={inputId}
            isOpen={isOpen}
            listboxId={listboxId}
            isPlaceholder={!selectedOption}
            hasError={!!error}
            aria-required={isRequired}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            onClick={onToggle}
            onKeyDown={onKeyDown}
          >
            {selectedOption ? selectedOption.label : (placeholder ?? 'Select...')}
          </SelectTrigger>
        )}
      />
    </FormField>
  );
};
