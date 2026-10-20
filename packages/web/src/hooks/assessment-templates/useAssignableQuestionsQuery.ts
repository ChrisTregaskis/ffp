import { useQuery } from '@tanstack/react-query';

import type { AdminQuestion } from '@ffp/core';

import { adminTemplateQuestionsApi } from '@web/lib/api/endpoints';
import { assessmentTemplateKeys } from '@web/lib/query/keys';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** The active questions a template does not hold yet — the pool the picker adds from. */
export const useAssignableQuestionsQuery = (
  templatePublicId: string,
  options?: Omit<UseQueryOptions<AdminQuestion[]>, 'queryKey' | 'queryFn'>
): UseQueryResult<AdminQuestion[]> => {
  return useQuery({
    queryKey: assessmentTemplateKeys.assignable(templatePublicId),
    queryFn: ({ signal }) => adminTemplateQuestionsApi.listAssignable(templatePublicId, signal),
    ...options,
    enabled: !!templatePublicId && (options?.enabled ?? true),
  });
};
