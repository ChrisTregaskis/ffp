import { useFieldsForm } from '../hooks/useFieldsForm';

import { FormEmailInput } from './FormEmailInput';
import { FormError } from './FormError';
import { FormPasswordInput } from './FormPasswordInput';
import { FormTextInput } from './FormTextInput';

import type { Field, SubmitHandler } from '../shared/types';
import type { FieldValues, DefaultValues } from 'react-hook-form';

export interface FormProps<TFieldValues extends FieldValues> {
  fields: Field<TFieldValues>[];
  onSubmit: SubmitHandler<TFieldValues>;
  defaultValues?: DefaultValues<TFieldValues>;
  submitLabel?: string;
  errorMessage?: string;
  isLoading?: boolean;
}

/**
 * Standard form wrapper component
 *
 * Features:
 * - Declarative field-based configuration
 * - Automatic field rendering based on dataType
 * - Built-in validation from field definitions
 * - Loading state handling
 * - Form-level error display
 *
 * Usage:
 * ```tsx
 * <Form
 *   fields={loginFormFields}
 *   onSubmit={handleLogin}
 *   submitLabel="Log In"
 *   errorMessage={apiError}
 *   isLoading={isSubmitting}
 * />
 * ```
 */
export const Form = <TFieldValues extends FieldValues>({
  fields,
  onSubmit,
  defaultValues,
  submitLabel = 'Submit',
  errorMessage,
  isLoading = false,
}: FormProps<TFieldValues>): JSX.Element => {
  const { methods, formState } = useFieldsForm({
    fields,
    defaultValues,
  });

  // Sort fields by order
  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  const renderField = (field: Field<TFieldValues>): JSX.Element => {
    const commonProps = {
      name: field.name,
      label: field.label,
      placeholder: field.placeholder,
      register: methods.register,
      errors: formState.errors,
      isRequired: field.validation?.isRequired,
    };

    // Determine field type based on name and dataType
    const fieldName = String(field.name).toLowerCase();

    if (fieldName.includes('password')) {
      return <FormPasswordInput key={String(field.name)} {...commonProps} />;
    }

    if (fieldName.includes('email') || field.validation?.pattern?.toString().includes('@')) {
      return <FormEmailInput key={String(field.name)} {...commonProps} />;
    }

    // Default to text input
    return <FormTextInput key={String(field.name)} {...commonProps} />;
  };

  return (
    <form
      onSubmit={(e) => {
        void methods.handleSubmit(onSubmit)(e);
      }}
      className="space-y-4"
    >
      {errorMessage && <FormError message={errorMessage} />}

      {sortedFields.map(renderField)}

      <button
        type="submit"
        disabled={isLoading || formState.isSubmitting}
        className={`
          w-full px-4 py-2 rounded-md font-medium text-white
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${
            isLoading || formState.isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-primary-dark'
          }
        `}
      >
        {isLoading || formState.isSubmitting ? 'Submitting...' : submitLabel}
      </button>
    </form>
  );
};
