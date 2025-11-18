import { useState } from 'react';

import { Icon } from '@web/components/Icon/Icon';
import { Text } from '@web/components/text/Text';
import type { PasswordStrength } from '@web/utils/passwordStrength';

import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

export interface PasswordInputProps {
  /** Input label */
  label: string;
  /** Input placeholder */
  placeholder?: string;
  /** Current password value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Input name for form */
  name: string;
  /** Whether the input has an error */
  hasError?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Password strength (null if not yet determined) */
  strength?: PasswordStrength | null;
  /** Whether to show the strength indicator */
  showStrength?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
}

/**
 * Password input component with show/hide toggle and strength indicator.
 *
 * Features:
 * - Toggle to show/hide password characters
 * - Password strength indicator in top-right corner (when showStrength is true)
 * - Error state styling
 */
export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  name,
  hasError = false,
  errorMessage,
  strength,
  showStrength = false,
  disabled = false,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleToggleVisibility = (): void => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label htmlFor={name} className="block">
        <Text styleProps={{ size: 'sm', weight: 'medium' }} className="text-gray-700">
          {label}
        </Text>
      </label>

      {/* Input container with relative positioning for absolute elements */}
      <div className="relative">
        {/* Password strength indicator (top-right) */}
        {showStrength && <PasswordStrengthIndicator strength={strength ?? null} />}

        {/* Input field */}
        <input
          type={isPasswordVisible ? 'text' : 'password'}
          id={name}
          name={name}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full rounded-lg border px-4 py-3 pr-12 text-base
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:bg-gray-100
            ${
              hasError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
          `}
        />

        {/* Show/Hide toggle button */}
        <button
          type="button"
          onClick={handleToggleVisibility}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
        >
          <Icon
            name={isPasswordVisible ? 'VisibilityOff' : 'Visibility'}
            styleProps={{ size: 'md' }}
          />
        </button>
      </div>

      {/* Error message */}
      {hasError && errorMessage && (
        <Text styleProps={{ size: 'sm' }} className="text-red-600">
          {errorMessage}
        </Text>
      )}
    </div>
  );
};
