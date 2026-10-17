import { z } from 'zod';

import type {
  AdminQuestion,
  AssignQuestionsInput,
  ReorderTemplateQuestionsInput,
  TemplateQuestionResponse,
} from '@ffp/core';
import { adminQuestionSchema, templateQuestionResponseSchema } from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const questionsPath = (templatePublicId: string): string =>
  `/admin/assessment-templates/${templatePublicId}/questions`;

const templateQuestionsResponseSchema = z.object({
  templateQuestions: z.array(templateQuestionResponseSchema),
});

const assignableQuestionsResponseSchema = z.object({
  questions: z.array(adminQuestionSchema),
  count: z.number().int().nonnegative(),
});

/** Composing questions from the bank onto a template. Every verb requires the system_admin role. */
export const adminTemplateQuestionsApi = {
  /** Active questions not yet on the template, ordered by slug. Unpaginated, so search is the caller's. */
  listAssignable: async (
    templatePublicId: string,
    signal?: AbortSignal
  ): Promise<AdminQuestion[]> => {
    const path = `/admin/assessment-templates/${templatePublicId}/assignable-questions`;
    const response = await ffpClient.get(path, { signal });

    return parseApiResponse(assignableQuestionsResponseSchema, response, { method: 'GET', path })
      .questions;
  },

  /** Appends the questions in the order given. Answers 409 when one is already assigned. */
  assign: async (
    templatePublicId: string,
    data: AssignQuestionsInput
  ): Promise<TemplateQuestionResponse[]> => {
    const path = questionsPath(templatePublicId);
    const response = await ffpClient.post(path, data);

    return parseApiResponse(templateQuestionsResponseSchema, response, { method: 'POST', path })
      .templateQuestions;
  },

  /** Removes the assignment only; the question stays in the bank. */
  unassign: async (templatePublicId: string, questionPublicId: string): Promise<void> => {
    await ffpClient.delete(`${questionsPath(templatePublicId)}/${questionPublicId}`);
  },

  /** The payload must be exactly the assigned set, in its new order. */
  reorder: async (
    templatePublicId: string,
    data: ReorderTemplateQuestionsInput
  ): Promise<TemplateQuestionResponse[]> => {
    const path = `${questionsPath(templatePublicId)}/reorder`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(templateQuestionsResponseSchema, response, { method: 'PUT', path })
      .templateQuestions;
  },
};
