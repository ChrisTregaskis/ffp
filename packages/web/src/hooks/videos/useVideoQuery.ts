import { useQuery } from '@tanstack/react-query';

import type { VideoDetailResponse } from '@ffp/core';

import { videosApi } from '@web/lib/api';
import { videoKeys } from '@web/lib/query';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

export interface UseVideoQueryOptions
  extends Omit<UseQueryOptions<VideoDetailResponse>, 'queryKey' | 'queryFn'> {
  /** Include archived and draft videos (admin use) */
  includeInactive?: boolean;
}

// Fetch a single video by ID
export const useVideoQuery = (
  videoId: string,
  options?: UseVideoQueryOptions
): UseQueryResult<VideoDetailResponse> => {
  const { includeInactive, ...queryOptions } = options ?? {};

  return useQuery({
    queryKey: videoKeys.detail(videoId),
    queryFn: ({ signal }) => videosApi.get(videoId, { includeInactive, signal }),
    staleTime: minutesToMs(5),
    enabled: !!videoId,
    ...queryOptions,
  });
};
