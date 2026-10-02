import { useQuery } from '@tanstack/react-query';

import type { PaginatedQuestionList, PaginationInput } from '@ffp/core';

import type { AdminQuestionFilterInput } from '@web/lib/api/endpoints';
import { adminQuestionsApi } from '@web/lib/api/endpoints';
import { questionKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Fetches a paginated list of questions with search and filters. */
export const useAdminQuestionsQuery = (
  pagination: PaginationInput,
  filters: AdminQuestionFilterInput,
  options?: Omit<UseQueryOptions<PaginatedQuestionList>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedQuestionList> => {
  return useQuery({
    queryKey: questionKeys.list({ ...pagination, ...filters }),
    queryFn: ({ signal }) => adminQuestionsApi.list(pagination, filters, signal),
    staleTime: minutesToMs(2),
    ...options,
  });
};
