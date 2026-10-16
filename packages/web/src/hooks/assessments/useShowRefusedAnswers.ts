import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { TEMPLATE_LINKED_STEP_TYPES } from '@ffp/core';

import { ASSESSMENT_ACTION } from '@web/contexts/assessments/constants';
import { useAssessment } from '@web/contexts/assessments/useAssessment';
import { assessmentsApi } from '@web/lib/api';
import { assessmentKeys } from '@web/lib/query';

import { ASSESSMENT_TEMPLATE_STALE_TIME } from './useAssessmentTemplateQuery';

/**
 * Puts the server's messages on the questions it refused and takes the member to the first
 * step showing one. Resolves false when the refusal named no question, or none this flow's
 * steps show (or their questions failed to load), so the caller says so another way.
 */
export const useShowRefusedAnswers = (): ((
  fieldErrors: Record<string, string>
) => Promise<boolean>) => {
  const { assessmentState, assessmentDispatch } = useAssessment();
  const queryClient = useQueryClient();
  const { steps } = assessmentState;

  return useCallback(
    async (fieldErrors: Record<string, string>): Promise<boolean> => {
      if (Object.keys(fieldErrors).length === 0) {
        return false;
      }

      assessmentDispatch({ type: ASSESSMENT_ACTION.SET_FIELD_ERRORS, payload: { fieldErrors } });

      const questionSteps = steps.filter(
        (step) => step.templateId && TEMPLATE_LINKED_STEP_TYPES.some((type) => type === step.type)
      );

      try {
        const templates = await Promise.all(
          questionSteps.map((step) => {
            const templateId = step.templateId ?? '';

            return queryClient.fetchQuery({
              queryKey: assessmentKeys.template(templateId),
              queryFn: ({ signal }) => assessmentsApi.getTemplate(templateId, signal),
              staleTime: ASSESSMENT_TEMPLATE_STALE_TIME,
            });
          })
        );
        const stepIndex = templates.findIndex((template) =>
          template.templateQuestions.some((question) => question.id in fieldErrors)
        );

        if (stepIndex < 0) {
          return false;
        }

        assessmentDispatch({
          type: ASSESSMENT_ACTION.GO_TO_STEP,
          payload: { stepId: questionSteps[stepIndex].id },
        });

        return true;
      } catch {
        return false;
      }
    },
    [steps, assessmentDispatch, queryClient]
  );
};
