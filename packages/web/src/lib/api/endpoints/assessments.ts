import {
  assessmentFlowSchema,
  assessmentResultsResponseSchema,
  assessmentTemplateWithQuestionsSchema,
  saveProgressResponseSchema,
  startAssessmentResponseSchema,
  submitAssessmentResponseSchema,
  type AssessmentFlow,
  type AssessmentResultsResponse,
  type AssessmentTemplate,
  type AssessmentTemplateWithQuestions,
  type SaveProgressRequest,
  type SaveProgressResponse,
  type StartAssessmentResponse,
  type SubmitAssessmentRequest,
  type SubmitAssessmentResponse,
} from '@ffp/core';

import { ffpClient } from '../client';

const basePath = '/assessments';

/**
 * Assessment API methods
 *
 * All responses are validated against Zod schemas from @ffp/core
 * to ensure type safety at runtime, not just compile time.
 *
 * @example
 * import { assessmentsApi } from '@web/lib/api';
 *
 * const flow = await assessmentsApi.getFlow('flow-id');
 * const results = await assessmentsApi.getResults('assessment-id');
 */
export const assessmentsApi = {
  /**
   * Get assessment flow by ID
   */
  getFlow: async (flowId: string, signal?: AbortSignal): Promise<AssessmentFlow> => {
    const response = await ffpClient.get(`${basePath}/flows/${flowId}`, { signal });
    return assessmentFlowSchema.parse(response);
  },

  /**
   * Get assessment template by ID (includes questions)
   */
  getTemplate: async (
    templateId: string,
    signal?: AbortSignal
  ): Promise<AssessmentTemplateWithQuestions> => {
    const response = await ffpClient.get(`${basePath}/templates/${templateId}`, { signal });

    return assessmentTemplateWithQuestionsSchema.parse(response);
  },

  /**
   * Start a new assessment (or resume existing)
   *
   * Returns full assessment state including steps, answers, and resume status.
   */
  start: async (flowId: string): Promise<StartAssessmentResponse> => {
    const response = await ffpClient.post(`${basePath}/start`, { flowId });

    return startAssessmentResponseSchema.parse(response);
  },

  /**
   * Save assessment progress
   *
   * Returns branching evaluation results including next step and any warnings.
   */
  saveProgress: async (
    assessmentId: string,
    payload: SaveProgressRequest
  ): Promise<SaveProgressResponse> => {
    const response = await ffpClient.put(`${basePath}/${assessmentId}/progress`, payload);

    return saveProgressResponseSchema.parse(response);
  },

  /**
   * Submit assessment answers for scoring
   *
   * Returns the scoring job ID for status polling.
   */
  submit: async (
    assessmentId: string,
    payload: SubmitAssessmentRequest
  ): Promise<SubmitAssessmentResponse> => {
    const response = await ffpClient.post(`${basePath}/${assessmentId}/submit`, payload);

    return submitAssessmentResponseSchema.parse(response);
  },

  /**
   * Get assessment results (for polling after submission)
   */
  getResults: async (
    assessmentId: string,
    signal?: AbortSignal
  ): Promise<AssessmentResultsResponse> => {
    const response = await ffpClient.get(`${basePath}/${assessmentId}/results`, { signal });

    return assessmentResultsResponseSchema.parse(response);
  },
};

// Re-export types for consumers
export type {
  AssessmentFlow,
  AssessmentResultsResponse,
  AssessmentTemplate,
  AssessmentTemplateWithQuestions,
  SaveProgressRequest,
  SaveProgressResponse,
  StartAssessmentResponse,
  SubmitAssessmentRequest,
  SubmitAssessmentResponse,
};
