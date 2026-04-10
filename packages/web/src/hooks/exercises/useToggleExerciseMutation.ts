import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ProgrammeDetailResponse, ToggleExerciseCompletionResponse } from '@ffp/core';

import { exercisesApi } from '@web/lib/api';
import { programmeKeys } from '@web/lib/query';
import { applyOptimisticExerciseToggle } from '@web/utils/programme-cache';

import type { UseMutationResult } from '@tanstack/react-query';

export interface ToggleExerciseVariables {
  completionId: string;
  completed: boolean;
}

/**
 * Toggle exercise completion status with optimistic update.
 *
 * Immediately updates the programme detail cache so the UI reflects
 * the change without waiting for the server. On error, reverts from
 * the snapshot. Cascade results available via onSuccess callback.
 */
export const useToggleExerciseMutation = (): UseMutationResult<
  ToggleExerciseCompletionResponse,
  Error,
  ToggleExerciseVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ completionId, completed }: ToggleExerciseVariables) => {
      return exercisesApi.toggleCompletion(completionId, completed);
    },

    onMutate: async (variables) => {
      // Cancel in-flight queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: programmeKeys.activeDetail() });

      // Snapshot current cache
      const previousDetail = queryClient.getQueryData<ProgrammeDetailResponse>(
        programmeKeys.activeDetail()
      );

      // Optimistically update the exercise completion in the cache
      if (previousDetail) {
        queryClient.setQueryData<ProgrammeDetailResponse>(
          programmeKeys.activeDetail(),
          applyOptimisticExerciseToggle(previousDetail, variables.completionId, variables.completed)
        );
      }

      return { previousDetail };
    },

    onError: (_error, _variables, context) => {
      // Revert to snapshot on error
      if (context?.previousDetail) {
        queryClient.setQueryData(programmeKeys.activeDetail(), context.previousDetail);
      }
    },

    onSettled: () => {
      // Invalidate to ensure cache is in sync with server
      void queryClient.invalidateQueries({ queryKey: programmeKeys.activeDetail() });
      void queryClient.invalidateQueries({ queryKey: programmeKeys.activeProgress() });
    },
  });
};
