import { Text } from '@web/components/text';

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
    <div className="mb-4">
      <label htmlFor={inputId} className="block mb-1">
        <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}>
          {label}
        </Text>
        {isRequired && (
          <Text styleProps={{ colour: 'destructive' }} className="ml-1">
            *
          </Text>
        )}
      </label>

      <textarea
        id={inputId}
        placeholder={placeholder}
        rows={rows}
        aria-required={isRequired}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...register(name)}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm resize-y
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      />

      {error && (
        <Text
          as="p"
          id={errorId}
          styleProps={{ size: 'sm', colour: 'destructive' }}
          className="mt-1"
          role="alert"
        >
          {error}
        </Text>
      )}
    </div>
  );
};
