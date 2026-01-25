import { useMutation, useQueryClient } from '@tanstack/react-query';

import { assessmentsApi } from '@web/lib/api';
import type { ApiError } from '@web/lib/api/client/errors';
import type { SubmitAnswersPayload } from '@web/lib/api/endpoints/assessments';
import { assessmentKeys } from '@web/lib/query';

import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';

/** Input for submitting an assessment */
export interface SubmitAssessmentInput {
  assessmentId: string;
  payload: SubmitAnswersPayload;
}

/**
 * Submit assessment answers
 *
 * Finalises an assessment by submitting all answers for scoring.
 * Invalidates the assessment results cache on success to trigger
 * a fresh fetch of the processing/complete status.
 */
export const useSubmitAssessment = (
  options?: Omit<UseMutationOptions<void, ApiError, SubmitAssessmentInput>, 'mutationFn'>
): UseMutationResult<void, ApiError, SubmitAssessmentInput> => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: ({ assessmentId, payload }: SubmitAssessmentInput) =>
      assessmentsApi.submit(assessmentId, payload),
    onSuccess: (...args) => {
      const [, variables] = args;

      // Invalidate results cache to trigger fresh fetch of scoring status
      void queryClient.invalidateQueries({
        queryKey: assessmentKeys.results(variables.assessmentId),
      });

      // Also invalidate user assessments list (status changed)
      void queryClient.invalidateQueries({
        queryKey: assessmentKeys.userAssessments(),
      });

      // Call user-provided onSuccess if provided
      return options?.onSuccess?.(...args);
    },
  });
};
