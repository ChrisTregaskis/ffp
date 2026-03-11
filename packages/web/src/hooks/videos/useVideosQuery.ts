import { useQuery } from '@tanstack/react-query';

import type { VideoFilterInput, VideoListApiResponse } from '@ffp/core';

import { videosApi } from '@web/lib/api';
import { videoKeys } from '@web/lib/query';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

// Fetch the video catalogue with optional filters
export const useVideosQuery = (
  filters?: VideoFilterInput,
  options?: Omit<UseQueryOptions<VideoListApiResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<VideoListApiResponse> => {
  return useQuery({
    queryKey: videoKeys.list(filters),
    queryFn: ({ signal }) => videosApi.list(filters, signal),
    staleTime: minutesToMs(5),
    ...options,
  });
};
