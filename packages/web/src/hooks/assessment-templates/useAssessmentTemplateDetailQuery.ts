import { useQuery } from '@tanstack/react-query';

import type { AdminAssessmentTemplateDetail } from '@web/lib/api/endpoints';
import { adminAssessmentTemplatesApi } from '@web/lib/api/endpoints';
import { assessmentTemplateKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** A template with its assigned questions and the flows using it, by public identifier. */
export const useAssessmentTemplateDetailQuery = (
  publicId: string,
  options?: Omit<UseQueryOptions<AdminAssessmentTemplateDetail>, 'queryKey' | 'queryFn'>
): UseQueryResult<AdminAssessmentTemplateDetail> => {
  return useQuery({
    queryKey: assessmentTemplateKeys.detail(publicId),
    queryFn: () => adminAssessmentTemplatesApi.get(publicId),
    enabled: !!publicId,
    staleTime: minutesToMs(2),
    ...options,
  });
};
