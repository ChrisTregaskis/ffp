import { useQuery } from '@tanstack/react-query';

import type { VideoDetailResponse } from '@ffp/core';

import { videosApi } from '@web/lib/api';
import { videoKeys } from '@web/lib/query';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

// Fetch a single video by ID
export const useVideoQuery = (
  videoId: string,
  options?: Omit<UseQueryOptions<VideoDetailResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<VideoDetailResponse> => {
  return useQuery({
    queryKey: videoKeys.detail(videoId),
    queryFn: ({ signal }) => videosApi.get(videoId, signal),
    staleTime: minutesToMs(5),
    enabled: !!videoId,
    ...options,
  });
};
