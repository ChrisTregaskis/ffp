import { createContext, useContext } from 'react';

import type {
  Control,
  FieldErrors,
  FieldValues,
  UseFormGetValues,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';

export interface FormContextValue<TFieldValues extends FieldValues = FieldValues> {
  register: UseFormRegister<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  handleSubmit: UseFormHandleSubmit<TFieldValues>;
  isSubmitting: boolean;
  setValue: UseFormSetValue<TFieldValues>;
  watch: UseFormWatch<TFieldValues>;
  getValues: UseFormGetValues<TFieldValues>;
}

const FormContext = createContext<FormContextValue | null>(null);

export const FormProvider = FormContext.Provider;

/**
 * Access the composable form context.
 *
 * Must be used within a `<ComposableForm>` wrapper.
 */
export const useComposableFormContext = <
  TFieldValues extends FieldValues = FieldValues,
>(): FormContextValue<TFieldValues> => {
  const ctx = useContext(FormContext);

  if (!ctx) {
    throw new Error('useComposableFormContext must be used within a <ComposableForm>');
  }

  return ctx as FormContextValue<TFieldValues>;
};
