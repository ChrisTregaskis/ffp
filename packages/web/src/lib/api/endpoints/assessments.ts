import {
  assessmentFlowSchema,
  assessmentResultsResponseSchema,
  assessmentTemplateWithQuestionsSchema,
  saveProgressResponseSchema,
  startAssessmentResponseSchema,
  submitAssessmentResponseSchema,
  userAssessmentStatusResponseSchema,
  type AssessmentFlow,
  type AssessmentResultsResponse,
  type AssessmentTemplate,
  type AssessmentTemplateWithQuestions,
  type SaveProgressRequest,
  type SaveProgressResponse,
  type StartAssessmentResponse,
  type SubmitAssessmentRequest,
  type SubmitAssessmentResponse,
  type UserAssessmentStatusResponse,
} from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

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
    const path = `${basePath}/flows/${flowId}`;
    const response = await ffpClient.get(path, { signal });

    return parseApiResponse(assessmentFlowSchema, response, { method: 'GET', path });
  },

  /**
   * Get assessment template by ID (includes questions)
   */
  getTemplate: async (
    templateId: string,
    signal?: AbortSignal
  ): Promise<AssessmentTemplateWithQuestions> => {
    const path = `${basePath}/templates/${templateId}`;
    const response = await ffpClient.get(path, { signal });

    return parseApiResponse(assessmentTemplateWithQuestionsSchema, response, {
      method: 'GET',
      path,
    });
  },

  /**
   * Start a new assessment (or resume existing)
   *
   * Returns full assessment state including steps, answers, and resume status.
   */
  start: async (
    flowId: string,
    options?: { isReassessment?: boolean }
  ): Promise<StartAssessmentResponse> => {
    const path = `${basePath}/start`;
    const response = await ffpClient.post(path, {
      flowId,
      isReassessment: options?.isReassessment,
    });

    return parseApiResponse(startAssessmentResponseSchema, response, { method: 'POST', path });
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
    const path = `${basePath}/${assessmentId}/progress`;
    const response = await ffpClient.put(path, payload);

    return parseApiResponse(saveProgressResponseSchema, response, { method: 'PUT', path });
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
    const path = `${basePath}/${assessmentId}/submit`;
    const response = await ffpClient.post(path, payload);

    return parseApiResponse(submitAssessmentResponseSchema, response, { method: 'POST', path });
  },

  /**
   * Get user's assessment/programme status
   *
   * Returns whether the user has an active programme and the default
   * assessment flow ID for redirect.
   */
  getUserStatus: async (signal?: AbortSignal): Promise<UserAssessmentStatusResponse> => {
    const path = `${basePath}/user-status`;
    const response = await ffpClient.get(path, { signal });

    return parseApiResponse(userAssessmentStatusResponseSchema, response, {
      method: 'GET',
      path,
    });
  },

  /**
   * Get assessment results (for polling after submission)
   */
  getResults: async (
    assessmentId: string,
    signal?: AbortSignal
  ): Promise<AssessmentResultsResponse> => {
    const path = `${basePath}/${assessmentId}/results`;
    const response = await ffpClient.get(path, { signal });

    return parseApiResponse(assessmentResultsResponseSchema, response, { method: 'GET', path });
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
  UserAssessmentStatusResponse,
};
