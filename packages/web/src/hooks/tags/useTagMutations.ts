import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AdminTag, CreateTagInput, UpdateTagInput } from '@ffp/core';

import { adminTagsApi } from '@web/lib/api';
import { tagKeys, videoKeys } from '@web/lib/query/keys';

import type { QueryClient, UseMutationResult } from '@tanstack/react-query';

export interface UpdateTagVariables {
  publicId: string;
  data: UpdateTagInput;
}

// The video lists show tag labels, so a renamed or retired tag refreshes them too
const invalidateTagReaders = (queryClient: QueryClient): void => {
  void queryClient.invalidateQueries({ queryKey: tagKeys.categories() });
  void queryClient.invalidateQueries({ queryKey: videoKeys.adminLists() });
};

/** Mutation hook for adding a tag to a category. */
export const useCreateTagMutation = (): UseMutationResult<AdminTag, Error, CreateTagInput> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTagInput) => adminTagsApi.createTag(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.categories() });
    },
  });
};

/** Mutation hook for renaming a tag or reactivating it. */
export const useUpdateTagMutation = (): UseMutationResult<AdminTag, Error, UpdateTagVariables> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateTagVariables) => adminTagsApi.updateTag(publicId, data),
    onSuccess: () => {
      invalidateTagReaders(queryClient);
    },
  });
};

/** Mutation hook for deactivating a tag. */
export const useDeactivateTagMutation = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => adminTagsApi.deactivateTag(publicId),
    onSuccess: () => {
      invalidateTagReaders(queryClient);
    },
  });
};
