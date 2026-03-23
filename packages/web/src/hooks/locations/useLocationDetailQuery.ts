import { useQuery } from '@tanstack/react-query';

import type { LocationDetailResponse } from '@ffp/core';

import { adminLocationsApi } from '@web/lib/api/endpoints';
import { locationKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Fetches a single location by ID for the edit page. */
export const useLocationDetailQuery = (
  locationId: string,
  options?: Omit<UseQueryOptions<LocationDetailResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<LocationDetailResponse> => {
  return useQuery({
    queryKey: locationKeys.detail(locationId),
    queryFn: () => adminLocationsApi.get(locationId),
    staleTime: minutesToMs(2),
    enabled: !!locationId,
    ...options,
  });
};
