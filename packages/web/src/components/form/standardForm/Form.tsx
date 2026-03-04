import { useCallback, useMemo } from 'react';

import { Button } from '@web/components/button/Button';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';

import { useFieldsForm } from '../hooks/useFieldsForm';
import { FieldDataType } from '../shared/FieldDataType';

import { FormSelect } from './FormSelect';
import { FormTagInput } from './FormTagInput';
import { FormTextarea } from './FormTextarea';
import { FormTextInput } from './FormTextInput';

import type { Field, SubmitHandler } from '../shared/types';
import type { FieldValues, DefaultValues } from 'react-hook-form';

export interface FormProps<TFieldValues extends FieldValues> {
  fields: Field<TFieldValues>[];
  onSubmit: SubmitHandler<TFieldValues>;
  defaultValues?: DefaultValues<TFieldValues>;
  submitLabel?: string;
  errorMessage?: string;
  onClearFormError?: () => void; // Clear error on user interaction
  isSubmitting?: boolean; // External submitting state (e.g., from async API calls)
}

/**
 * Standard form wrapper component
 *
 * Usage:
 * ```tsx
 * <Form
 *   fields={loginFormFields}
 *   onSubmit={handleLogin}
 *   submitLabel="Log In"
 *   errorMessage={apiError}
 *   onClearFormError={() => setApiError(undefined)}
 *   isSubmitting={isSubmitting}
 * />
 * ```
 */
export const Form = <TFieldValues extends FieldValues>({
  fields,
  onSubmit,
  defaultValues,
  submitLabel = 'Submit',
  errorMessage,
  onClearFormError,
  isSubmitting = false,
}: FormProps<TFieldValues>): JSX.Element => {
  const { methods, formState } = useFieldsForm({
    fields,
    defaultValues,
  });

  // Sort fields by order (memoized to prevent unnecessary recalculation)
  const sortedFields = useMemo(() => [...fields].sort((a, b) => a.order - b.order), [fields]);

  const renderField = (field: Field<TFieldValues>): JSX.Element => {
    const key = String(field.name);

    switch (field.dataType) {
      case FieldDataType.TEXTAREA:
        return (
          <FormTextarea
            key={key}
            name={field.name}
            label={field.label}
            placeholder={field.placeholder}
            register={methods.register}
            errors={formState.errors}
            isRequired={field.validation?.isRequired}
          />
        );

      case FieldDataType.SELECT:
        return (
          <FormSelect
            key={key}
            name={field.name}
            label={field.label}
            options={field.inputOptions ?? []}
            placeholder={field.placeholder}
            register={methods.register}
            errors={formState.errors}
            isRequired={field.validation?.isRequired}
          />
        );

      case FieldDataType.TAG_INPUT:
        return (
          <FormTagInput
            key={key}
            name={field.name}
            label={field.label}
            placeholder={field.placeholder}
            control={methods.control}
            errors={formState.errors}
            isRequired={field.validation?.isRequired}
          />
        );

      default: {
        let inputType: 'text' | 'email' | 'password' = 'text';

        if (field.dataType === FieldDataType.PASSWORD) {
          inputType = 'password';
        } else {
          const fieldName = String(field.name).toLowerCase();

          if (fieldName.includes('password')) {
            inputType = 'password';
          } else if (
            fieldName.includes('email') ||
            field.validation?.pattern?.toString().includes('@')
          ) {
            inputType = 'email';
          }
        }

        return (
          <FormTextInput
            key={key}
            name={field.name}
            label={field.label}
            type={inputType}
            placeholder={field.placeholder}
            register={methods.register}
            errors={formState.errors}
            isRequired={field.validation?.isRequired}
          />
        );
      }
    }
  };

  // Determine if form is currently submitting (internal or external state)
  const isFormSubmitting = isSubmitting || formState.isSubmitting;

  // Memoize submit handler to prevent function recreation on each render
  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      void methods.handleSubmit(onSubmit)(e);
    },
    [methods, onSubmit]
  );

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Enhanced form-level error display */}
      {errorMessage && (
        <div role="alert" className="rounded-md bg-error-50 border border-error-200 p-4 mb-6">
          <div className="flex items-start">
            <Icon name={Icons.ALERTCIRCLE} styleProps={{ size: 'sm', colour: '#dc2626' }} />
            <p className="ml-3 text-sm text-error-700 flex-1">{errorMessage}</p>
            {onClearFormError && (
              <button
                type="button"
                onClick={onClearFormError}
                className="ml-auto text-error-400 hover:text-error-600 transition-colors"
                aria-label="Dismiss error"
              >
                <Icon name={Icons.CLOSE} styleProps={{ size: 'xs', colour: 'currentColor' }} />
              </button>
            )}
          </div>
        </div>
      )}

      {sortedFields.map(renderField)}

      <Button type="submit" loading={isFormSubmitting} fullWidth>
        {submitLabel}
      </Button>
    </form>
  );
};
