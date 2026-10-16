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
