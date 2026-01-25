import { useMutation, useQueryClient } from '@tanstack/react-query';

import { assessmentsApi } from '@web/lib/api';
import type { ApiError } from '@web/lib/api/client/errors';
import type { StartAssessmentResponse } from '@web/lib/api/endpoints/assessments';
import { assessmentKeys } from '@web/lib/query';

import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';

/** Input for starting a new assessment */
export interface StartAssessmentInput {
  /** Assessment flow ID to start */
  flowId: string;
}

/**
 * Start a new assessment (or resume existing)
 *
 * Creates a new user assessment instance from a flow, or resumes
 * an existing in-progress assessment for the same flow.
 *
 * Invalidates user-assessments cache on success.
 */
export const useStartAssessment = (
  options?: Omit<
    UseMutationOptions<StartAssessmentResponse, ApiError, StartAssessmentInput>,
    'mutationFn'
  >
): UseMutationResult<StartAssessmentResponse, ApiError, StartAssessmentInput> => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: ({ flowId }: StartAssessmentInput) => assessmentsApi.start(flowId),
    onSuccess: (...args) => {
      // Invalidate user assessments list to reflect the new/resumed assessment
      void queryClient.invalidateQueries({
        queryKey: assessmentKeys.userAssessments(),
      });

      // Call user-provided onSuccess if provided
      return options?.onSuccess?.(...args);
    },
  });
};
