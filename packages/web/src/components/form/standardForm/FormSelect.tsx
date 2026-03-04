import { Text } from '@web/components/text';

import type { UseFormRegister, FieldErrors, FieldValues, Path } from 'react-hook-form';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface FormSelectProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  register: UseFormRegister<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  isRequired?: boolean;
}

/**
 * Select dropdown field component for standard forms
 *
 * Consistent styling with FormTextInput. Renders a native <select>
 * with an optional placeholder option.
 */
export const FormSelect = <TFieldValues extends FieldValues>({
  name,
  label,
  options,
  placeholder,
  register,
  errors,
  isRequired,
}: FormSelectProps<TFieldValues>): JSX.Element => {
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

      <select
        id={inputId}
        aria-required={isRequired}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...register(name)}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

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
