import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  CreateExerciseRequest,
  MemberExerciseResponse,
  MemberSessionOrderResponse,
  UpdateExerciseRequest,
} from '@ffp/core';

import { adminMemberProgrammeApi } from '@web/lib/api/endpoints';
import { userKeys } from '@web/lib/query/keys';

import type { UseMutationResult } from '@tanstack/react-query';

export interface AddMemberExerciseVariables {
  sessionId: string;
  data: CreateExerciseRequest;
}

export interface UpdateMemberExerciseVariables {
  exerciseId: string;
  data: UpdateExerciseRequest;
}

export interface ReorderMemberItemsVariables {
  /** The session whose exercises, or the phase whose sessions, are reordered */
  parentId: string;
  orderedIds: string[];
}

export interface MemberProgrammeMutations {
  addExercise: UseMutationResult<MemberExerciseResponse, Error, AddMemberExerciseVariables>;
  updateExercise: UseMutationResult<MemberExerciseResponse, Error, UpdateMemberExerciseVariables>;
  removeExercise: UseMutationResult<void, Error, string>;
  reorderExercises: UseMutationResult<MemberExerciseResponse[], Error, ReorderMemberItemsVariables>;
  reorderSessions: UseMutationResult<
    MemberSessionOrderResponse[],
    Error,
    ReorderMemberItemsVariables
  >;
}

/**
 * Edits to one member's programme, keyed by the member's publicId. Every edit refreshes the
 * admin's programme read, which holds the whole structure.
 */
export const useMemberProgrammeMutations = (publicId: string): MemberProgrammeMutations => {
  const queryClient = useQueryClient();
  const onSuccess = (): void => {
    void queryClient.invalidateQueries({ queryKey: userKeys.programme(publicId) });
  };

  return {
    addExercise: useMutation({
      mutationFn: ({ sessionId, data }: AddMemberExerciseVariables) =>
        adminMemberProgrammeApi.addExercise(publicId, sessionId, data),
      onSuccess,
    }),
    updateExercise: useMutation({
      mutationFn: ({ exerciseId, data }: UpdateMemberExerciseVariables) =>
        adminMemberProgrammeApi.updateExercise(publicId, exerciseId, data),
      onSuccess,
    }),
    removeExercise: useMutation({
      mutationFn: (exerciseId: string) =>
        adminMemberProgrammeApi.removeExercise(publicId, exerciseId),
      onSuccess,
    }),
    reorderExercises: useMutation({
      mutationFn: ({ parentId, orderedIds }: ReorderMemberItemsVariables) =>
        adminMemberProgrammeApi.reorderExercises(publicId, parentId, orderedIds),
      onSuccess,
    }),
    reorderSessions: useMutation({
      mutationFn: ({ parentId, orderedIds }: ReorderMemberItemsVariables) =>
        adminMemberProgrammeApi.reorderSessions(publicId, parentId, orderedIds),
      onSuccess,
    }),
  };
};
