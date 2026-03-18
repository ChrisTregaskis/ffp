import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreateExerciseRequest, ExerciseResponse, UpdateExerciseRequest } from '@ffp/core';

import { adminExercisesApi } from '@web/lib/api/endpoints';
import { programmeTemplateKeys } from '@web/lib/query/keys';

import type { UseMutationResult } from '@tanstack/react-query';

export interface CreateExerciseVariables {
  sessionId: string;
  data: CreateExerciseRequest;
}

export interface UpdateExerciseVariables {
  exerciseId: string;
  data: UpdateExerciseRequest;
}

export interface DeleteExerciseVariables {
  exerciseId: string;
}

export interface ReorderExercisesVariables {
  sessionId: string;
  orderedIds: string[];
}

/** Invalidates both template detail and session exercise queries. */
const invalidateExerciseQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  templateId: string
): void => {
  void queryClient.invalidateQueries({
    queryKey: programmeTemplateKeys.detail(templateId),
  });

  void queryClient.invalidateQueries({
    queryKey: programmeTemplateKeys.sessionExercises(),
  });
};

/** Mutation hook for creating an exercise within a session. */
export const useCreateExerciseMutation = (
  templateId: string
): UseMutationResult<ExerciseResponse, Error, CreateExerciseVariables> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: CreateExerciseVariables) =>
      adminExercisesApi.create(sessionId, data),
    onSuccess: () => {
      invalidateExerciseQueries(queryClient, templateId);
    },
  });
};

/** Mutation hook for updating an exercise. */
export const useUpdateExerciseMutation = (
  templateId: string
): UseMutationResult<ExerciseResponse, Error, UpdateExerciseVariables> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ exerciseId, data }: UpdateExerciseVariables) =>
      adminExercisesApi.update(exerciseId, data),
    onSuccess: () => {
      invalidateExerciseQueries(queryClient, templateId);
    },
  });
};

/** Mutation hook for deleting an exercise. */
export const useDeleteExerciseMutation = (
  templateId: string
): UseMutationResult<void, Error, DeleteExerciseVariables> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ exerciseId }: DeleteExerciseVariables) => adminExercisesApi.delete(exerciseId),
    onSuccess: () => {
      invalidateExerciseQueries(queryClient, templateId);
    },
  });
};

/** Mutation hook for reordering exercises within a session. */
export const useReorderExercisesMutation = (
  templateId: string
): UseMutationResult<ExerciseResponse[], Error, ReorderExercisesVariables> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, orderedIds }: ReorderExercisesVariables) =>
      adminExercisesApi.reorder(sessionId, { orderedIds }),
    onSuccess: () => {
      invalidateExerciseQueries(queryClient, templateId);
    },
  });
};
