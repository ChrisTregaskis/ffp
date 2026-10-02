import { getFieldDescriptionIds } from '../shared/fieldDescription';
import { getFieldErrorMessage } from '../shared/fieldError';
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
  /** `"any"` allows decimals; the browser's default step of 1 refuses them */
  step?: number | 'any';
  /** Fields to re-validate when this one changes */
  deps?: Path<TFieldValues>[];
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
  step,
  deps,
}: FormNumberInputProps<TFieldValues>): JSX.Element => {
  const error = getFieldErrorMessage(errors, name);
  const inputId = String(name);
  const { errorId, describedBy } = getFieldDescriptionIds(inputId, { error });

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
        step={step}
        placeholder={placeholder}
        aria-required={isRequired}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...register(name, { validate, deps })}
        className={`${getInputClassName(!!error)} w-full px-3 py-2`}
      />
    </FormField>
  );
};
