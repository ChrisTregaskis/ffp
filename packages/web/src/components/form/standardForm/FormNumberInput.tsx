import { getInputClassName } from '../shared/inputStyles';

import { FormField } from './FormField';

import type { UseFormRegister, FieldErrors, FieldValues, Path } from 'react-hook-form';

export interface FormNumberInputProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  min?: number;
  register: UseFormRegister<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  isRequired?: boolean;
  /** Custom validation function — return error message string or true if valid */
  validate?: (value: string) => string | true;
}

/**
 * Number input field component for standard forms.
 *
 * Renders an HTML number input with consistent styling, label, and error display.
 * Accepts optional min value and custom validation function.
 */
export const FormNumberInput = <TFieldValues extends FieldValues>({
  name,
  label,
  placeholder,
  min,
  register,
  errors,
  isRequired,
  validate,
}: FormNumberInputProps<TFieldValues>): JSX.Element => {
  const error = errors[name]?.message as string | undefined;
  const inputId = String(name);
  const errorId = `${inputId}-error`;

  return (
    <FormField
      htmlFor={inputId}
      label={label}
      isRequired={isRequired}
      error={error}
      errorId={errorId}
    >
      <input
        id={inputId}
        type="number"
        min={min}
        placeholder={placeholder}
        aria-required={isRequired}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...register(name, { validate })}
        className={`${getInputClassName(!!error)} w-full px-3 py-2`}
      />
    </FormField>
  );
};
