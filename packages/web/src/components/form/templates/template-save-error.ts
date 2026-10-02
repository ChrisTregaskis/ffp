import { ApiError } from '@web/lib/api';

/** A template save's failure as the form shows it; a 409 is always a taken slug. */
export const toTemplateSaveError = (err: Error): string =>
  ApiError.isApiError(err) && err.status === 409
    ? 'A template with this slug already exists. Please use a different slug.'
    : err.message;
