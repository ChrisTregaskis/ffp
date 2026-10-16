import { useMutation, useQueryClient } from '@tanstack/react-query';

import { assessmentsApi } from '@web/lib/api';
import type { ApiError } from '@web/lib/api/client/errors';
import type { AssessmentResultsResponse, SafetyGate } from '@web/lib/api/endpoints/assessments';
import { assessmentKeys } from '@web/lib/query';

import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Record the member's confirmation that they have acted on their safety advice.
 *
 * Writes the returned gate straight into the cached results, so the result unlocks
 * without waiting for the next poll. A poll already in flight is cancelled first:
 * scoring may still be running, and its older gate would land over the new one.
 */
export const useAcknowledgeSafetyAdvice = (): UseMutationResult<SafetyGate, ApiError, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assessmentId: string) => assessmentsApi.acknowledgeSafetyAdvice(assessmentId),
    onMutate: async (assessmentId) => {
      await queryClient.cancelQueries({ queryKey: assessmentKeys.results(assessmentId) });
    },
    onSuccess: (safetyGate, assessmentId) => {
      queryClient.setQueryData<AssessmentResultsResponse>(
        assessmentKeys.results(assessmentId),
        (results) => (results ? { ...results, safetyGate } : results)
      );
    },
  });
};
