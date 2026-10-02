import { useQuery } from '@tanstack/react-query';

import type { AssessmentTemplate } from '@ffp/core';

import { adminAssessmentTemplatesApi } from '@web/lib/api/endpoints';
import { assessmentTemplateKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

export const useAssessmentTemplatesQuery = (
  activeOnly = false,
  options?: Omit<UseQueryOptions<AssessmentTemplate[]>, 'queryKey' | 'queryFn'>
): UseQueryResult<AssessmentTemplate[]> => {
  return useQuery({
    queryKey: assessmentTemplateKeys.list(activeOnly),
    queryFn: ({ signal }) => adminAssessmentTemplatesApi.list(activeOnly, signal),
    staleTime: minutesToMs(5),
    ...options,
  });
};
