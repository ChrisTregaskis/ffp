import { useMutation, useQueryClient } from '@tanstack/react-query';

import { assessmentsApi } from '@web/lib/api';
import type { ApiError } from '@web/lib/api/client/errors';
import type {
  SubmitAssessmentRequest,
  SubmitAssessmentResponse,
} from '@web/lib/api/endpoints/assessments';
import { assessmentKeys } from '@web/lib/query';

import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';

/** Input for submitting an assessment */
export interface SubmitAssessmentInput {
  /** Assessment ID to submit */
  assessmentId: string;
  /** Final answers to submit */
  payload: SubmitAssessmentRequest;
}

/**
 * Submit assessment answers for scoring
 *
 * Finalises an assessment by submitting all answers for scoring.
 * Returns the scoring job ID for status tracking.
 *
 * Invalidates the assessment results and user assessments caches
 * on success to trigger fresh fetches.
 */
export const useSubmitAssessment = (
  options?: Omit<
    UseMutationOptions<SubmitAssessmentResponse, ApiError, SubmitAssessmentInput>,
    'mutationFn'
  >
): UseMutationResult<SubmitAssessmentResponse, ApiError, SubmitAssessmentInput> => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: ({ assessmentId, payload }: SubmitAssessmentInput) => {
      return assessmentsApi.submit(assessmentId, payload);
    },
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
