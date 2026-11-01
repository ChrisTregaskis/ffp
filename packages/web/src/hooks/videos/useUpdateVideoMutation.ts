import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AdminVideoDetail, UpdateVideoInput } from '@ffp/core';

import { adminVideosApi } from '@web/lib/api';
import { videoKeys } from '@web/lib/query';

import type { UseMutationResult } from '@tanstack/react-query';

interface UpdateVideoVariables {
  publicId: string;
  data: UpdateVideoInput;
}

/** Mutation hook for updating video metadata and tags via PUT /admin/videos/{publicId}. */
export const useUpdateVideoMutation = (): UseMutationResult<
  AdminVideoDetail,
  Error,
  UpdateVideoVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateVideoVariables) =>
      adminVideosApi.updateVideo(publicId, data),
    onSuccess: (_data, { publicId }) => {
      void queryClient.invalidateQueries({ queryKey: videoKeys.adminLists() });
      void queryClient.invalidateQueries({ queryKey: videoKeys.detail(publicId) });
    },
  });
};
