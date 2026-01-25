import { useMutation } from '@tanstack/react-query';

import { assessmentsApi } from '@web/lib/api';
import type { ApiError } from '@web/lib/api/client/errors';
import type { SaveProgressPayload } from '@web/lib/api/endpoints/assessments';

import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';

/** Input for saving assessment progress */
export interface SaveProgressInput {
  assessmentId: string;
  payload: SaveProgressPayload;
}

/**
 * Save assessment progress
 *
 * Persists partial answers during assessment completion.
 */
export const useSaveProgress = (
  options?: Omit<UseMutationOptions<void, ApiError, SaveProgressInput>, 'mutationFn'>
): UseMutationResult<void, ApiError, SaveProgressInput> => {
  return useMutation({
    ...options,
    mutationFn: ({ assessmentId, payload }: SaveProgressInput) =>
      assessmentsApi.saveProgress(assessmentId, payload),
  });
};
