import { Textarea } from '@web/components/atoms';
import { getFieldDescriptionIds } from '@web/utils/field-description';
import { getFieldErrorMessage } from '@web/utils/field-error';

import { FormField } from '../FormField';

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
  const error = getFieldErrorMessage(errors, name);
  const inputId = String(name);
  const { errorId, describedBy } = getFieldDescriptionIds(inputId, { error });
  const { ref, ...field } = register(name);

  return (
    <FormField
      htmlFor={inputId}
      label={label}
      isRequired={isRequired}
      error={error}
      errorId={errorId}
    >
      <Textarea
        id={inputId}
        placeholder={placeholder}
        rows={rows}
        hasError={!!error}
        aria-required={isRequired}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...field}
        forwardedRef={ref}
      />
    </FormField>
  );
};
