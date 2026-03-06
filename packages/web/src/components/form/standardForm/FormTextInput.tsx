import { useState } from 'react';

import { IconButton } from '@web/components/button/IconButton';
import { Icons } from '@web/components/Icon/types';

import { getInputClassName } from '../shared/inputStyles';

import { FormField } from './FormField';

import type { UseFormRegister, FieldErrors, FieldValues, Path } from 'react-hook-form';

export interface FormTextInputProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label: string;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  register: UseFormRegister<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  isRequired?: boolean;
}

/**
 * Text input field component for standard forms
 *
 * Supports text, email, and password input types with consistent styling.
 *
 * Features:
 * - Multiple input types: text (default), email, password
 * - Password visibility toggle (show/hide button)
 * - Accessible label with required indicator
 * - Error state styling
 * - Error message display
 * - Tailwind CSS styling with FFP theme
 */
export const FormTextInput = <TFieldValues extends FieldValues>({
  name,
  label,
  type = 'text',
  placeholder,
  register,
  errors,
  isRequired,
}: FormTextInputProps<TFieldValues>): JSX.Element => {
  const [showPassword, setShowPassword] = useState(false);
  const error = errors[name]?.message as string | undefined;
  const inputId = String(name);
  const errorId = `${inputId}-error`;

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const inputElement = (
    <input
      id={inputId}
      type={inputType}
      placeholder={placeholder}
      aria-required={isRequired}
      aria-invalid={!!error}
      aria-describedby={error ? errorId : undefined}
      {...register(name)}
      className={`${getInputClassName(!!error)} w-full px-3 py-2 ${isPassword ? 'pr-10' : ''}`}
    />
  );

  return (
    <FormField
      htmlFor={inputId}
      label={label}
      isRequired={isRequired}
      error={error}
      errorId={errorId}
    >
      {isPassword ? (
        <div className="relative">
          {inputElement}
          <IconButton
            icon={showPassword ? Icons.VISIBILITYOFF : Icons.VISIBILITY}
            size="sm"
            ariaLabel={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => {
              setShowPassword(!showPassword);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
          />
        </div>
      ) : (
        inputElement
      )}
    </FormField>
  );
};
