import { getInputClassName } from '../shared/inputStyles';

import { FormField } from './FormField';

import type { UseFormRegister, FieldErrors, FieldValues, Path } from 'react-hook-form';

export interface FormTextareaProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  register: UseFormRegister<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  isRequired?: boolean;
  rows?: number;
}

/**
 * Textarea field component for standard forms
 *
 * Consistent styling with FormTextInput, supports multi-line text entry.
 */
export const FormTextarea = <TFieldValues extends FieldValues>({
  name,
  label,
  placeholder,
  register,
  errors,
  isRequired,
  rows = 3,
}: FormTextareaProps<TFieldValues>): JSX.Element => {
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
      <textarea
        id={inputId}
        placeholder={placeholder}
        rows={rows}
        aria-required={isRequired}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...register(name)}
        className={`${getInputClassName(!!error)} w-full px-3 py-2 resize-y`}
      />
    </FormField>
  );
};
