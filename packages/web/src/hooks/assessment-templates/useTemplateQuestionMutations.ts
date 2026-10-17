import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { TemplateQuestionResponse } from '@ffp/core';

import type { AdminAssessmentTemplateDetail } from '@web/lib/api/endpoints';
import { adminTemplateQuestionsApi } from '@web/lib/api/endpoints';
import { invalidateListsAndDetail } from '@web/lib/query';
import { assessmentTemplateKeys, questionKeys } from '@web/lib/query/keys';

import type { QueryClient, UseMutationResult } from '@tanstack/react-query';

/**
 * A change to a template's question set moves its question count, the pool it
 * can still assign from, and each question's usage on the question bank.
 */
const invalidateComposition = (queryClient: QueryClient, templatePublicId: string): void => {
  invalidateListsAndDetail(queryClient, assessmentTemplateKeys, { publicId: templatePublicId });
  void queryClient.invalidateQueries({ queryKey: questionKeys.details() });
};

/**
 * Writes the ordered set a write returns straight into the detail, so a second
 * move made before the refetch lands is built from the new order, not the old.
 */
const writeTemplateQuestions = (
  queryClient: QueryClient,
  templatePublicId: string,
  templateQuestions: TemplateQuestionResponse[]
): void => {
  queryClient.setQueryData<AdminAssessmentTemplateDetail>(
    assessmentTemplateKeys.detail(templatePublicId),
    (current) => current && { ...current, templateQuestions }
  );
};

/** Appends questions from the bank to a template. */
export const useAssignTemplateQuestionsMutation = (
  templatePublicId: string
): UseMutationResult<TemplateQuestionResponse[], Error, string[]> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionPublicIds: string[]) =>
      adminTemplateQuestionsApi.assign(templatePublicId, { questionPublicIds }),
    onSuccess: (templateQuestions) => {
      writeTemplateQuestions(queryClient, templatePublicId, templateQuestions);
    },
    onSettled: () => {
      // A 409 means the cached pool was stale, so refresh on failure as well
      invalidateComposition(queryClient, templatePublicId);
    },
  });
};

/** Removes a question from a template; the question stays in the bank. */
export const useUnassignTemplateQuestionMutation = (
  templatePublicId: string
): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionPublicId: string) =>
      adminTemplateQuestionsApi.unassign(templatePublicId, questionPublicId),
    onSuccess: () => {
      invalidateComposition(queryClient, templatePublicId);
    },
  });
};

/** Reorders a template's questions; the payload is the whole assigned set. */
export const useReorderTemplateQuestionsMutation = (
  templatePublicId: string
): UseMutationResult<TemplateQuestionResponse[], Error, string[]> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedQuestionPublicIds: string[]) =>
      adminTemplateQuestionsApi.reorder(templatePublicId, { orderedQuestionPublicIds }),
    onSuccess: (templateQuestions) => {
      writeTemplateQuestions(queryClient, templatePublicId, templateQuestions);
    },
    onSettled: () => {
      // A refused reorder means the rendered set was stale; refetch either way
      void queryClient.invalidateQueries({
        queryKey: assessmentTemplateKeys.detail(templatePublicId),
      });
    },
  });
};
