import { useQuery } from '@tanstack/react-query';

import type { ProgrammeDetailResponse } from '@ffp/core';

import { programmesApi } from '@web/lib/api';
import { programmeKeys } from '@web/lib/query';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch the full programme detail with tiered visibility
 *
 * Returns programme hierarchy: phases, sessions, exercises with status.
 */
export const useProgrammeDetailQuery = (
  options?: Omit<UseQueryOptions<ProgrammeDetailResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<ProgrammeDetailResponse> => {
  return useQuery({
    queryKey: programmeKeys.activeDetail(),
    queryFn: ({ signal }) => programmesApi.getDetail(signal),
    staleTime: minutesToMs(5),
    ...options,
  });
};
