import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AdminQuestionDetail, CreateQuestionInput, UpdateQuestionInput } from '@ffp/core';

import { adminQuestionsApi } from '@web/lib/api/endpoints';
import { invalidateListsAndDetail } from '@web/lib/query';
import { questionKeys } from '@web/lib/query/keys';

import type { UseMutationResult } from '@tanstack/react-query';

export interface UpdateQuestionVariables {
  publicId: string;
  data: UpdateQuestionInput;
}

/** Mutation hook for creating a question. */
export const useCreateQuestionMutation = (): UseMutationResult<
  AdminQuestionDetail,
  Error,
  CreateQuestionInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuestionInput) => adminQuestionsApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
    },
  });
};

/** Mutation hook for updating a question. */
export const useUpdateQuestionMutation = (): UseMutationResult<
  AdminQuestionDetail,
  Error,
  UpdateQuestionVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateQuestionVariables) =>
      adminQuestionsApi.update(publicId, data),
    onSuccess: (_data, variables) => {
      invalidateListsAndDetail(queryClient, questionKeys, variables);
    },
  });
};

/** Mutation hook for deactivating a question (soft delete). */
export const useDeactivateQuestionMutation = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => adminQuestionsApi.deactivate(publicId),
    onSuccess: (_data, publicId) => {
      invalidateListsAndDetail(queryClient, questionKeys, { publicId });
    },
  });
};
