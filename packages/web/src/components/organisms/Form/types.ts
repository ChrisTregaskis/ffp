import type { FieldDataType } from './FieldDataType';
import type { Path, SubmitHandler } from 'react-hook-form';

/**
 * Validation configuration for form fields
 */
export interface FieldValidation<TFieldValues> {
  isRequired?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: {
    callback: (value: unknown, formValues?: TFieldValues) => boolean;
    message: string;
  };
}

/**
 * Base field configuration for forms
 */
export interface Field<TFieldValues> {
  order: number;
  name: Path<TFieldValues>;
  label: string;
  dataType: FieldDataType;
  placeholder?: string;
  inputOptions?: { label: string; value: string | number }[];
  validation?: FieldValidation<TFieldValues>;
}

// Re-export SubmitHandler from react-hook-form for convenience
export type { SubmitHandler };
