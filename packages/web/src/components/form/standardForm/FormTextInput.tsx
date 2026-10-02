import { useState } from 'react';

import { IconButton } from '@web/components/button/IconButton';
import { Icons } from '@web/components/Icon/types';

import { getFieldDescriptionIds } from '../shared/fieldDescription';
import { getFieldErrorMessage } from '../shared/fieldError';
import { getInputClassName } from '../shared/inputStyles';

import { FormField } from './FormField';

import type {
  UseFormRegister,
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
} from 'react-hook-form';

/** Native input attributes that can be forwarded to the underlying <input> element */
type NativeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'name' | 'type' | 'placeholder' | 'disabled' | 'readOnly' | 'id' | 'className'
>;

export interface FormTextInputProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label: string;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  register: UseFormRegister<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  isRequired?: boolean;
  /** Short guidance shown under the input */
  hint?: string;
  /** Disables the input (read-only appearance with reduced opacity) */
  disabled?: boolean;
  /** Looks like `disabled`, but the value is still submitted */
  readOnly?: boolean;
  /** Additional native input attributes (e.g. inputMode, autoComplete) */
  inputProps?: NativeInputProps;
  /** Extra CSS classes appended to the input element */
  inputClassName?: string;
  /** Additional react-hook-form register options (e.g. required, pattern) */
  registerOptions?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
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
  hint,
  disabled = false,
  readOnly = false,
  inputProps,
  inputClassName,
  registerOptions,
}: FormTextInputProps<TFieldValues>): JSX.Element => {
  const [showPassword, setShowPassword] = useState(false);
  const error = getFieldErrorMessage(errors, name);
  const inputId = String(name);
  const { hintId, errorId, describedBy } = getFieldDescriptionIds(inputId, { hint, error });

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const lockedClassName = disabled || readOnly ? 'cursor-not-allowed opacity-60 bg-muted' : '';

  const inputElement = (
    <input
      id={inputId}
      type={inputType}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      aria-required={isRequired}
      aria-invalid={!!error}
      aria-describedby={describedBy}
      {...inputProps}
      {...register(name, { disabled, ...registerOptions })}
      className={`${getInputClassName(!!error)} w-full px-3 py-2 ${isPassword ? 'pr-10' : ''} ${lockedClassName}${inputClassName ? ` ${inputClassName}` : ''}`}
    />
  );

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
