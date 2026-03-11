import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UpdateVideoInput, VideoDetailResponse } from '@ffp/core';

import { adminVideosApi } from '@web/lib/api';
import { videoKeys } from '@web/lib/query';

import type { UseMutationResult } from '@tanstack/react-query';

interface UpdateVideoVariables {
  id: string;
  data: UpdateVideoInput;
}

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
      // Invalidate admin list so table reflects updated data
      void queryClient.invalidateQueries({ queryKey: videoKeys.adminLists() });
      // Invalidate the specific video detail cache
      void queryClient.invalidateQueries({ queryKey: videoKeys.detail(variables.id) });
      // Invalidate public lists too (status changes affect public catalogue)
      void queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
    },
  });
};
