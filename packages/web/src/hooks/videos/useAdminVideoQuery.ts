import { useQuery } from '@tanstack/react-query';

import type { AdminVideoDetail } from '@ffp/core';

import { adminVideosApi } from '@web/lib/api';
import { videoKeys } from '@web/lib/query';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** A video in any status, with its tags, by public identifier. */
export const useAdminVideoQuery = (
  publicId: string,
  options?: Omit<UseQueryOptions<AdminVideoDetail>, 'queryKey' | 'queryFn'>
): UseQueryResult<AdminVideoDetail> => {
  return useQuery({
    queryKey: videoKeys.detail(publicId),
    queryFn: ({ signal }) => adminVideosApi.get(publicId, signal),
    staleTime: minutesToMs(5),
    enabled: !!publicId,
    ...options,
  });
};
