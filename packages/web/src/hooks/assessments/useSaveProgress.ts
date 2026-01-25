import { useMutation } from '@tanstack/react-query';

import { assessmentsApi } from '@web/lib/api';
import type { ApiError } from '@web/lib/api/client/errors';
import type { SaveProgressRequest, SaveProgressResponse } from '@web/lib/api/endpoints/assessments';

import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';

/** Input for saving assessment progress */
export interface SaveProgressInput {
  /** Assessment ID to save progress for */
  assessmentId: string;
  /** Progress data (answers and current step) */
  payload: SaveProgressRequest;
}

/**
 * Save assessment progress
 *
 * Persists answers and current step during assessment completion.
 */
export const useSaveProgress = (
  options?: Omit<
    UseMutationOptions<SaveProgressResponse, ApiError, SaveProgressInput>,
    'mutationFn'
  >
): UseMutationResult<SaveProgressResponse, ApiError, SaveProgressInput> => {
  return useMutation({
    ...options,
    mutationFn: ({ assessmentId, payload }: SaveProgressInput) =>
      assessmentsApi.saveProgress(assessmentId, payload),
  });
};
