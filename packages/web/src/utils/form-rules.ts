/**
 * A required text field's rule for a form that trims on submit: a value of only spaces would
 * save blank, so it fails like an empty one. Use it as the field's `validate` in place of
 * `required`, alone or as one entry of a `validate` record.
 */
export const requiredText =
  (message: string) =>
  (value: unknown): true | string =>
    (typeof value === 'string' && value.trim() !== '') || message;
