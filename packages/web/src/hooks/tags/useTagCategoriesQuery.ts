import { useQuery } from '@tanstack/react-query';

import type { AdminTagCategory } from '@ffp/core';

import { adminTagsApi } from '@web/lib/api';
import { tagKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryResult } from '@tanstack/react-query';

/** Every tag category with its tags, inactive ones included. */
export const useTagCategoriesQuery = (): UseQueryResult<AdminTagCategory[]> => {
  return useQuery({
    queryKey: tagKeys.categories(),
    queryFn: ({ signal }) => adminTagsApi.listCategories(signal),
    staleTime: minutesToMs(5),
  });
};
