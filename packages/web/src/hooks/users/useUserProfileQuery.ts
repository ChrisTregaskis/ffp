import { useQuery } from '@tanstack/react-query';

import type { UserProfileResponse } from '@ffp/core';

import { usersApi } from '@web/lib/api';
import { userKeys } from '@web/lib/query';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch the authenticated user's profile (firstName, lastName, email, role)
 *
 * Stale after 30 minutes — profile data rarely changes within a session.
 */
export const useUserProfileQuery = (
  options?: Omit<UseQueryOptions<UserProfileResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<UserProfileResponse> => {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: ({ signal }) => usersApi.getMe(signal),
    staleTime: minutesToMs(30),
    ...options,
  });
};
