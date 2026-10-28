import { questionIdFromErrorPath } from '@ffp/core';

import { ApiError } from '@web/lib/api';

/**
 * The member-facing message for each question a refused save or submit names, keyed by
 * questionId (the first message per question). Empty for any other failure.
 */
export const toQuestionFieldErrors = (error: unknown): Record<string, string> => {
  if (!ApiError.isApiError(error) || !error.isValidationError) {
    return {};
  }

  const fieldErrors: Record<string, string> = {};

  for (const { path, message } of error.fieldErrors) {
    const questionId = questionIdFromErrorPath(path);

    if (questionId && !(questionId in fieldErrors)) {
      fieldErrors[questionId] = message;
    }
  }

  return fieldErrors;
};

/**
 * The server's own message for a refused save that names no field (a step the flow
 * no longer has, say), which is worded for the member. Null for a refusal naming fields, which
 * shows on their questions, and for any other failure (a 5xx, the network), which gets the
 * caller's generic text.
 */
export const toRefusalMessage = (error: unknown): string | null =>
  ApiError.isApiError(error) && error.isValidationError && error.fieldErrors.length === 0
    ? error.message
    : null;
