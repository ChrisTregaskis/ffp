import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ToggleExerciseCompletionResponse } from '@ffp/core';

import { exercisesApi } from '@web/lib/api';
import { programmeKeys } from '@web/lib/query';

import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';

export interface ToggleExerciseVariables {
  completionId: string;
  completed: boolean;
}

type ToggleExerciseMutationOptions = Omit<
  UseMutationOptions<ToggleExerciseCompletionResponse, Error, ToggleExerciseVariables>,
  'mutationFn'
>;

/**
 * Toggle exercise completion status.
 *
 * Returns the updated completion record and cascade results
 * (whether session/phase/programme auto-completed).
 *
 * Optimistic update pattern will be added in FFP-411.
 */
export const useToggleExerciseMutation = (
  options?: ToggleExerciseMutationOptions
): UseMutationResult<ToggleExerciseCompletionResponse, Error, ToggleExerciseVariables> => {
  const queryClient = useQueryClient();

  const { onSuccess: callerOnSuccess, ...restOptions } = options ?? {};

  return useMutation({
    ...restOptions,
    mutationFn: ({ completionId, completed }: ToggleExerciseVariables) => {
      return exercisesApi.toggleCompletion(completionId, completed);
    },
    onSuccess: (data, ...args) => {
      // Invalidate programme detail + progress so exercise statuses refresh
      void queryClient.invalidateQueries({ queryKey: programmeKeys.activeDetail() });
      void queryClient.invalidateQueries({ queryKey: programmeKeys.activeProgress() });

      callerOnSuccess?.(data, ...args);
    },
  });
};
