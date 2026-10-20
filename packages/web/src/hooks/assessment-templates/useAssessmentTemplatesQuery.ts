import { useQuery } from '@tanstack/react-query';

import type { AssessmentTemplateListItem } from '@ffp/core';

import { adminAssessmentTemplatesApi } from '@web/lib/api/endpoints';
import { assessmentTemplateKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Every template, active or not — what a step's template picker and name lookup read. */
export const useAssessmentTemplatesQuery = (
  options?: Omit<UseQueryOptions<AssessmentTemplateListItem[]>, 'queryKey' | 'queryFn'>
): UseQueryResult<AssessmentTemplateListItem[]> => {
  return useQuery({
    queryKey: assessmentTemplateKeys.catalogue(),
    queryFn: ({ signal }) => adminAssessmentTemplatesApi.listAll(signal),
    staleTime: minutesToMs(5),
    ...options,
  });
};
