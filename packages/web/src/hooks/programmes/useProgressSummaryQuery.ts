import { useQuery } from '@tanstack/react-query';

import type { ProgressSummaryResponse } from '@ffp/core';

import { programmesApi } from '@web/lib/api';
import { programmeKeys } from '@web/lib/query';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch aggregate progress statistics for the active programme
 *
 * Returns completion counts and percentages for phases, sessions, exercises.
 */
export const useProgressSummaryQuery = (
  options?: Omit<UseQueryOptions<ProgressSummaryResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<ProgressSummaryResponse> => {
  return useQuery({
    queryKey: programmeKeys.activeProgress(),
    queryFn: ({ signal }) => programmesApi.getProgressSummary(signal),
    staleTime: minutesToMs(1),
    ...options,
  });
};
