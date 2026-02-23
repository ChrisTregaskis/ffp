import { useQuery } from '@tanstack/react-query';

import type { ActiveProgrammeResponse } from '@ffp/core';

import { programmesApi } from '@web/lib/api';
import { programmeKeys } from '@web/lib/query';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch the current user's active programme
 *
 * Returns programme name, description, status, and start date.
 * Stale after 5 minutes — programme data changes infrequently.
 */
export const useActiveProgrammeQuery = (
  options?: Omit<UseQueryOptions<ActiveProgrammeResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<ActiveProgrammeResponse> => {
  return useQuery({
    queryKey: programmeKeys.active(),
    queryFn: ({ signal }) => programmesApi.getActive(signal),
    staleTime: minutesToMs(5),
    ...options,
  });
};
