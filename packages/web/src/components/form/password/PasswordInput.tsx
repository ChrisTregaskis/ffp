import { useState } from 'react';

import { IconButton } from '@web/components/button/IconButton';
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
      {/* Label row with strength indicator */}
      <div className="flex items-center justify-between">
        <label htmlFor={name}>
          <Text styleProps={{ size: 'sm', weight: 'medium' }} className="text-foreground">
            {label}
          </Text>
        </label>
        {/* Password strength indicator (aligned right in label row) */}
        {showStrength && <PasswordStrengthIndicator strength={strength ?? null} />}
      </div>

      {/* Input container with relative positioning for visibility toggle */}
      <div className="relative">
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
            disabled:cursor-not-allowed disabled:bg-muted
            ${
              hasError
                ? 'border-destructive focus:border-destructive focus:ring-destructive'
                : 'border-border focus:border-primary focus:ring-primary'
            }
          `}
        />

        {/* Show/Hide visibility toggle using IconButton */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <IconButton
            icon={isPasswordVisible ? 'VisibilityOff' : 'Visibility'}
            size="md"
            onClick={handleToggleVisibility}
            ariaLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            disabled={disabled}
            className="text-muted-foreground hover:text-foreground"
          />
        </div>
      </div>

      {/* Error message */}
      {hasError && errorMessage && (
        <Text styleProps={{ size: 'sm' }} className="text-destructive">
          {errorMessage}
        </Text>
      )}
    </div>
  );
};
