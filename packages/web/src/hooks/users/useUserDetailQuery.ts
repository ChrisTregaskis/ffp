import { useQuery } from '@tanstack/react-query';

import type { UserDetailResponse } from '@ffp/core';

import { adminUsersApi } from '@web/lib/api/endpoints';
import { userKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Fetches a single user by ID for the edit page. */
export const useUserDetailQuery = (
  userId: string,
  options?: Omit<UseQueryOptions<UserDetailResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<UserDetailResponse> => {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => adminUsersApi.get(userId),
    staleTime: minutesToMs(2),
    enabled: !!userId,
    ...options,
  });
};
