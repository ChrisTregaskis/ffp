import { useQuery } from '@tanstack/react-query';

import type { SignedVideoUrlResponse } from '@ffp/core';

import { videosApi } from '@web/lib/api';
import { videoKeys } from '@web/lib/query';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch a time-limited CloudFront signed URL for video playback
 *
 * Stale after 10 minutes — signed URLs have a 15-minute TTL,
 * so refetching at 10 minutes ensures the URL is always fresh.
 * Retries on error to handle expired URL scenarios.
 */
export const useVideoSignedUrlQuery = (
  videoId: string,
  options?: Omit<UseQueryOptions<SignedVideoUrlResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<SignedVideoUrlResponse> => {
  return useQuery({
    queryKey: videoKeys.signedUrl(videoId),
    queryFn: ({ signal }) => videosApi.getSignedUrl(videoId, signal),
    staleTime: minutesToMs(10),
    enabled: !!videoId,
    retry: 2,
    ...options,
  });
};
