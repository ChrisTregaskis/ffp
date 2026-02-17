import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ReplaceProgrammeResponse } from '@ffp/core';

import { programmesApi } from '@web/lib/api';
import { assessmentKeys, programmeKeys } from '@web/lib/query';

import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';

type ReplaceProgrammeMutationOptions = Omit<
  UseMutationOptions<ReplaceProgrammeResponse, Error, string>,
  'mutationFn'
>;

/**
 * Replace the active programme with a reassessment recommendation.
 *
 * Accepts the assessment ID as the mutation variable.
 * Invalidates programme and assessment status caches on success.
 */
export const useReplaceProgrammeMutation = (
  options?: ReplaceProgrammeMutationOptions
): UseMutationResult<ReplaceProgrammeResponse, Error, string> => {
  const queryClient = useQueryClient();

  const { onSuccess: callerOnSuccess, ...restOptions } = options ?? {};

  return useMutation({
    ...restOptions,
    mutationFn: (assessmentId: string) => {
      return programmesApi.replaceActive(assessmentId);
    },
    onSuccess: (data, ...args) => {
      // Invalidate caches so the UI reflects the new programme
      void queryClient.invalidateQueries({ queryKey: programmeKeys.active() });
      void queryClient.invalidateQueries({ queryKey: assessmentKeys.userStatus() });

      callerOnSuccess?.(data, ...args);
    },
  });
};
