import { EMAIL_PATTERN } from '@ffp/core';

import { FormTextInput } from '../FormTextInput';

import type { FieldErrors, FieldValues, Path, UseFormRegister } from 'react-hook-form';

export interface FormEmailInputProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  register: UseFormRegister<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  /** Makes the field required, with this message when it is left empty */
  requiredMessage?: string;
  disabled?: boolean;
  /** e.g. `username` on a sign-in screen, so password managers pair it with the password */
  autoComplete?: string;
}

/**
 * A labelled email field bound to a react-hook-form field: trimmed, and checked against the
 * shared email pattern.
 *
 * A text input with the email keyboard rather than `type="email"`: the browser's own email check
 * would show its bubble before the pattern rule's message.
 */
export const FormEmailInput = <TFieldValues extends FieldValues>({
  name,
  label,
  placeholder,
  register,
  errors,
  requiredMessage,
  disabled = false,
  autoComplete,
}: FormEmailInputProps<TFieldValues>): JSX.Element => (
  <FormTextInput<TFieldValues>
    name={name}
    label={label}
    placeholder={placeholder}
    register={register}
    errors={errors}
    isRequired={requiredMessage !== undefined}
    disabled={disabled}
    inputProps={{ inputMode: 'email', autoComplete }}
    registerOptions={{
      // A text input keeps the trailing space a keyboard suggestion or paste leaves, which
      // `type="email"` used to strip
      setValueAs: (value: string) => value.trim(),
      required: requiredMessage,
      pattern: { value: EMAIL_PATTERN, message: 'Please enter a valid email address' },
    }}
  />
);
