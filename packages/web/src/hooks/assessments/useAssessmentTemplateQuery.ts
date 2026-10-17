import { useQuery } from '@tanstack/react-query';

import type { AssessmentTemplateWithQuestions } from '@ffp/core';

import { assessmentsApi } from '@web/lib/api';
import { assessmentKeys } from '@web/lib/query';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** How long a fetched template stays fresh; shared with imperative fetches of it. */
export const ASSESSMENT_TEMPLATE_STALE_TIME = minutesToMs(10);

/**
 * Fetch assessment template by ID (includes questions)
 *
 * Fetches the assessment template which defines the structure
 * and configuration of an assessment type, including the
 * transformed templateQuestions array.
 */
export const useAssessmentTemplateQuery = (
  templateId: string,
  options?: Omit<UseQueryOptions<AssessmentTemplateWithQuestions>, 'queryKey' | 'queryFn'>
): UseQueryResult<AssessmentTemplateWithQuestions> => {
  return useQuery({
    queryKey: assessmentKeys.template(templateId),
    queryFn: ({ signal }) => assessmentsApi.getTemplate(templateId, signal),
    staleTime: ASSESSMENT_TEMPLATE_STALE_TIME,
    enabled: !!templateId,
    ...options,
  });
};
