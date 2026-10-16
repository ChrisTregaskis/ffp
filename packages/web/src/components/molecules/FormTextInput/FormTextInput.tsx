import { Input } from '@web/components/atoms';
import { getFieldDescriptionIds } from '@web/utils/field-description';
import { getFieldErrorMessage } from '@web/utils/field-error';

import { FormField } from '../FormField';
import { PasswordVisibilityInput } from '../PasswordVisibilityInput';

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
  'name' | 'type' | 'placeholder' | 'disabled' | 'readOnly' | 'id' | 'className' | 'size'
>;

export interface FormTextInputProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
> {
  name: TName;
  label: string;
  /** A number field still holds a string; convert it on submit (`utils/form-number.ts`). Email fields use `FormEmailInput`. */
  type?: 'text' | 'password' | 'number';
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
  /** Additional native input attributes (e.g. inputMode, autoComplete, min, step) */
  inputProps?: NativeInputProps;
  /** Extra CSS classes appended to the input element */
  inputClassName?: string;
  /**
   * Additional react-hook-form register options (e.g. required, pattern, validate, deps).
   * With a `validate`, leave out the explicit type argument so `name` infers the field and the validator gets its value type.
   */
  registerOptions?: RegisterOptions<TFieldValues, TName>;
}

/**
 * A labelled text, password or number input bound to a react-hook-form field.
 *
 * A password field gets the show/hide toggle.
 */
export const FormTextInput = <
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
>({
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
}: FormTextInputProps<TFieldValues, TName>): JSX.Element => {
  const error = getFieldErrorMessage(errors, name);
  const inputId = String(name);
  const { hintId, errorId, describedBy } = getFieldDescriptionIds(inputId, { hint, error });
  const { ref, ...field } = register(name, { disabled, ...registerOptions });

  const controlProps = {
    id: inputId,
    placeholder,
    disabled,
    readOnly,
    hasError: !!error,
    'aria-required': isRequired,
    'aria-invalid': !!error,
    'aria-describedby': describedBy,
    ...inputProps,
    ...field,
    forwardedRef: ref,
    className: inputClassName,
  };

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
      {type === 'password' ? (
        <PasswordVisibilityInput {...controlProps} />
      ) : (
        <Input type={type} {...controlProps} />
      )}
    </FormField>
  );
};
