import { useCallback } from 'react';
import { useForm } from 'react-hook-form';

import { FormProvider } from './FormContext';

import type { ReactNode } from 'react';
import type { DefaultValues, FieldValues, SubmitHandler } from 'react-hook-form';

export interface ComposableFormProps<TFieldValues extends FieldValues> {
  /** Form submission handler */
  onSubmit: SubmitHandler<TFieldValues>;
  /** Default values for the form fields */
  defaultValues?: DefaultValues<TFieldValues>;
  /** Form content — use standard form field components inside */
  children: ReactNode;
  /** Additional class names for the <form> element */
  className?: string;
}

/**
 * Composition-based form wrapper for bespoke form layouts.
 *
 * Wraps `useForm` from react-hook-form and provides context to child
 * field components via `useComposableFormContext()`.
 */
export const ComposableForm = <TFieldValues extends FieldValues>({
  onSubmit,
  defaultValues,
  children,
  className,
}: ComposableFormProps<TFieldValues>): JSX.Element => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<TFieldValues>({ defaultValues });

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      void handleSubmit(onSubmit)(e);
    },
    [handleSubmit, onSubmit]
  );

  // Generic context requires type erasure; consumer restores type via useComposableFormContext<T>()
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
  const contextValue = {
    register,
    control,
    errors,
    handleSubmit,
    isSubmitting,
    setValue,
    watch,
    getValues,
  } as any;
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */

  return (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    <FormProvider value={contextValue}>
      <form onSubmit={handleFormSubmit} className={className}>
        {children}
      </form>
    </FormProvider>
  );
};
