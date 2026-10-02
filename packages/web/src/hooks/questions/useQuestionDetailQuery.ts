import { useQuery } from '@tanstack/react-query';

import type { AdminQuestionDetail } from '@ffp/core';

import { adminQuestionsApi } from '@web/lib/api/endpoints';
import { questionKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** A question with its usage and linked video, by public identifier. */
export const useQuestionDetailQuery = (
  publicId: string,
  options?: Omit<UseQueryOptions<AdminQuestionDetail>, 'queryKey' | 'queryFn'>
): UseQueryResult<AdminQuestionDetail> => {
  return useQuery({
    queryKey: questionKeys.detail(publicId),
    queryFn: () => adminQuestionsApi.get(publicId),
    enabled: !!publicId,
    staleTime: minutesToMs(2),
    ...options,
  });
};
