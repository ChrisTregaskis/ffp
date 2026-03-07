import {
  useForm,
  type FieldValues,
  type DefaultValues,
  type Path,
  type RegisterOptions,
} from 'react-hook-form';

import type { Field } from '../shared/types';

export interface UseFieldsFormProps<TFieldValues extends FieldValues> {
  fields: Field<TFieldValues>[];
  defaultValues?: DefaultValues<TFieldValues>;
  liveValidate?: boolean;
}

/**
 * Core form hook that converts field definitions into React Hook Form validation
 *
 * This hook:
 * - Converts Field[] validation config to RegisterOptions
 * - Manages form state via React Hook Form
 * - Provides field registration with validation
 *
 * @param fields - Array of field definitions with validation rules
 * @param defaultValues - Initial form values
 * @param liveValidate - Enable onChange validation (default: onSubmit)
 * @returns Form methods and registration helpers
 */
export const useFieldsForm = <TFieldValues extends FieldValues>({
  fields,
  defaultValues,
  liveValidate = false,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
}: UseFieldsFormProps<TFieldValues>) => {
  const methods = useForm<TFieldValues>({
    defaultValues,
    mode: liveValidate ? 'onChange' : 'onSubmit',
  });

  /**
   * Generate React Hook Form validation rules from field definition
   */
  const getValidationRules = (field: Field<TFieldValues>): RegisterOptions<TFieldValues> => {
    const rules: RegisterOptions<TFieldValues> = {};
    const { validation } = field;

    if (!validation) {
      return rules;
    }

    if (validation.isRequired) {
      rules.required = `${field.label} is required`;
    }

    if (validation.minLength) {
      rules.minLength = {
        value: validation.minLength,
        message: `Minimum length is ${String(validation.minLength)}`,
      };
    }

    if (validation.maxLength) {
      rules.maxLength = {
        value: validation.maxLength,
        message: `Maximum length is ${String(validation.maxLength)}`,
      };
    }

    if (validation.min !== undefined) {
      rules.min = {
        value: validation.min,
        message: `Minimum value is ${String(validation.min)}`,
      };
    }

    if (validation.max !== undefined) {
      rules.max = {
        value: validation.max,
        message: `Maximum value is ${String(validation.max)}`,
      };
    }

    if (validation.pattern) {
      rules.pattern = {
        value: validation.pattern,
        message: 'Invalid format',
      };
    }

    if (validation.customValidator) {
      rules.validate = (value): string | boolean => {
        const formValues = methods.getValues();

        if (!validation.customValidator) {
          return true;
        }

        const isValid = validation.customValidator.callback(value, formValues);

        return isValid || validation.customValidator.message;
      };
    }

    return rules;
  };

  /**
   * Register a field with its validation rules
   */
  const registerField = (fieldName: Path<TFieldValues>): ReturnType<typeof methods.register> => {
    const field = fields.find((f) => f.name === fieldName);

    if (!field) {
      return methods.register(fieldName);
    }

    return methods.register(fieldName, getValidationRules(field));
  };

  return {
    methods,
    formState: methods.formState,
    watch: methods.watch,
    setValue: methods.setValue,
    getValues: methods.getValues,
    registerField,
  };
};
