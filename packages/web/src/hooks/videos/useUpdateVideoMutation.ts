import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UpdateVideoInput, VideoDetailResponse } from '@ffp/core';

import { adminVideosApi } from '@web/lib/api';
import type { SplitIdentifierVariables } from '@web/lib/api/client';
import { videoKeys, invalidateListsAndDetail } from '@web/lib/query';

import type { UseMutationResult } from '@tanstack/react-query';

type UpdateVideoVariables = SplitIdentifierVariables<UpdateVideoInput>;

/** Mutation hook for updating video metadata via PUT /admin/videos/{id}. */
export const useUpdateVideoMutation = (): UseMutationResult<
  VideoDetailResponse,
  Error,
  UpdateVideoVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateVideoVariables) => adminVideosApi.updateVideo(id, data),
    onSuccess: (_data, variables) => {
      // Videos are the one resource with two list keys. The helper reaches
      // `videoKeys.lists()`, the member-facing catalogue, which a status change
      // moves a video in or out of; the admin table is a separate key.
      invalidateListsAndDetail(queryClient, videoKeys, variables);
      void queryClient.invalidateQueries({ queryKey: videoKeys.adminLists() });
    },
  });
};
