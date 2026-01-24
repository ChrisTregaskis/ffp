import { useQuery } from '@tanstack/react-query';

import type { AssessmentFlow, AssessmentTemplate } from '@ffp/core';

import { assessmentsApi } from '@web/lib/api';
import { assessmentKeys } from '@web/lib/query';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch assessment flow by ID
 *
 * Fetches the assessment flow configuration including steps,
 * questions, and navigation rules.
 */
export const useAssessmentFlowQuery = (
  flowId: string,
  options?: Omit<UseQueryOptions<AssessmentFlow>, 'queryKey' | 'queryFn'>
): UseQueryResult<AssessmentFlow> => {
  return useQuery({
    queryKey: assessmentKeys.flow(flowId),
    queryFn: ({ signal }) => assessmentsApi.getFlow(flowId, signal),
    staleTime: minutesToMs(5),
    enabled: !!flowId,
    ...options,
  });
};

/**
 * Fetch assessment template by ID
 *
 * Fetches the assessment template which defines the structure
 * and configuration of an assessment type.
 */
export const useAssessmentTemplateQuery = (
  templateId: string,
  options?: Omit<UseQueryOptions<AssessmentTemplate>, 'queryKey' | 'queryFn'>
): UseQueryResult<AssessmentTemplate> => {
  return useQuery({
    queryKey: assessmentKeys.template(templateId),
    queryFn: ({ signal }) => assessmentsApi.getTemplate(templateId, signal),
    staleTime: minutesToMs(10),
    enabled: !!templateId,
    ...options,
  });
};
