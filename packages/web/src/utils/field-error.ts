import { get } from 'react-hook-form';

import type { FieldError, FieldErrors, FieldValues } from 'react-hook-form';

/** The message for a field, including one at a nested path such as `options.0.label`. */
export const getFieldErrorMessage = <TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>,
  name: string
): string | undefined => (get(errors, name) as FieldError | undefined)?.message;
