import { useQuery } from '@tanstack/react-query';

import type { AdminProgrammeDetailResponse } from '@ffp/core';

import { adminUsersApi } from '@web/lib/api/endpoints';
import { userKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Fetches a member's current programme, every phase in full, by user publicId. */
export const useUserProgrammeQuery = (
  publicId: string,
  options?: Omit<UseQueryOptions<AdminProgrammeDetailResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<AdminProgrammeDetailResponse> => {
  return useQuery({
    queryKey: userKeys.programme(publicId),
    queryFn: ({ signal }) => adminUsersApi.getProgramme(publicId, signal),
    staleTime: minutesToMs(2),
    enabled: !!publicId,
    ...options,
  });
};
