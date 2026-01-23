import type { AssessmentFlow, AssessmentTemplate, UserAssessmentScores } from '@ffp/core';

import { ffpClient } from '../client';

/** Payload for submitting assessment answers */
export interface SubmitAnswersPayload {
  answers: Record<string, unknown>;
  completedAt: string;
}

export interface AssessmentResultsResponse {
  status: 'processing' | 'complete';
  scores?: UserAssessmentScores;
  programmeId?: string;
}

/** Response from starting an assessment */
export interface StartAssessmentResponse {
  userAssessmentId: string;
  flowId: string;
}

const basePath = '/assessments';

/**
 * Assessment API methods
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
  getFlow: (flowId: string, signal?: AbortSignal): Promise<AssessmentFlow> =>
    ffpClient.get<AssessmentFlow>(`${basePath}/flows/${flowId}`, { signal }),

  /**
   * Get assessment template by ID
   */
  getTemplate: (templateId: string, signal?: AbortSignal): Promise<AssessmentTemplate> =>
    ffpClient.get<AssessmentTemplate>(`${basePath}/templates/${templateId}`, {
      signal,
    }),

  /**
   * Start a new assessment
   */
  start: (templateId: string): Promise<StartAssessmentResponse> =>
    ffpClient.post<StartAssessmentResponse>(`${basePath}/start`, {
      templateId,
    }),

  /**
   * Submit assessment answers
   */
  submit: async (assessmentId: string, payload: SubmitAnswersPayload): Promise<void> => {
    await ffpClient.post(`${basePath}/${assessmentId}/submit`, payload);
  },

  /**
   * Get assessment results
   */
  getResults: (assessmentId: string, signal?: AbortSignal): Promise<AssessmentResultsResponse> =>
    ffpClient.get<AssessmentResultsResponse>(`${basePath}/${assessmentId}/results`, { signal }),
};
