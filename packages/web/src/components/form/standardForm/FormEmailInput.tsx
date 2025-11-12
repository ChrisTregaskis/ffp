import type { UseFormRegister, FieldErrors, FieldValues, Path } from 'react-hook-form';

export interface FormEmailInputProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  register: UseFormRegister<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  isRequired?: boolean;
}

/**
 * Email input field component for standard forms
 *
 * Features:
 * - Native email input type with browser validation
 * - Accessible label with required indicator
 * - Error state styling
 * - Error message display
 * - Tailwind CSS styling with FFP theme
 */
export const FormEmailInput = <TFieldValues extends FieldValues>({
  name,
  label,
  placeholder,
  register,
  errors,
  isRequired,
}: FormEmailInputProps<TFieldValues>): JSX.Element => {
  const error = errors[name]?.message as string | undefined;

  return (
    <div className="mb-4">
      <label htmlFor={String(name)} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={String(name)}
        type="email"
        placeholder={placeholder}
        {...register(name)}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
