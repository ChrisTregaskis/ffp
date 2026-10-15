import { PasswordStrengthIndicator } from '@web/components/atoms';
import { getFieldDescriptionIds } from '@web/utils/field-description';
import type { PasswordStrength } from '@web/utils/passwordStrength';

import { FormField } from '../FormField';
import { PasswordVisibilityInput } from '../PasswordVisibilityInput';

/** The sign-in screens' larger, softer input, kept apart from the admin field look */
const AUTH_INPUT_CLASSES =
  'w-full rounded-lg border px-4 py-3 text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted';

const AUTH_INPUT_STATE_CLASSES = {
  valid: 'border-border focus:border-primary focus:ring-primary',
  error: 'border-destructive focus:border-destructive focus:ring-destructive',
};

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

/** A controlled password field for the sign-in screens, with the show/hide toggle and an optional strength reading. */
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
  const error = hasError ? errorMessage : undefined;
  const { errorId, describedBy } = getFieldDescriptionIds(name, { error });

  return (
    // The auth forms space their fields themselves, so the wrapper adds no margin
    <FormField
      htmlFor={name}
      label={label}
      labelAside={
        showStrength ? <PasswordStrengthIndicator strength={strength ?? null} /> : undefined
      }
      error={error}
      errorId={errorId}
      className=""
    >
      <PasswordVisibilityInput
        id={name}
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        disabled={disabled}
        appearance="bare"
        toggleSize="md"
        aria-invalid={hasError}
        aria-describedby={describedBy}
        className={`${AUTH_INPUT_CLASSES} ${AUTH_INPUT_STATE_CLASSES[hasError ? 'error' : 'valid']}`}
      />
    </FormField>
  );
};
