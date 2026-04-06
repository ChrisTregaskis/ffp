import {
  activeProgrammeResponseSchema,
  programmeDetailResponseSchema,
  progressSummaryResponseSchema,
  replaceProgrammeResponseSchema,
  type ActiveProgrammeResponse,
  type ProgrammeDetailResponse,
  type ProgressSummaryResponse,
  type ReplaceProgrammeResponse,
} from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const basePath = '/programmes';

/**
 * Programmes API methods
 *
 * All responses are validated against Zod schemas from @ffp/core
 * to ensure type safety at runtime, not just compile time.
 */
export const programmesApi = {
  /**
   * Get the current user's active programme
   */
  getActive: async (signal?: AbortSignal): Promise<ActiveProgrammeResponse> => {
    const path = `${basePath}/active`;
    const response = await ffpClient.get(path, { signal });

    return parseApiResponse(activeProgrammeResponseSchema, response, { method: 'GET', path });
  },

  /**
   * Get the full programme detail with tiered visibility (phases, sessions, exercises)
   */
  getDetail: async (signal?: AbortSignal): Promise<ProgrammeDetailResponse> => {
    const path = `${basePath}/active/detail`;
    const response = await ffpClient.get(path, { signal });

    return parseApiResponse(programmeDetailResponseSchema, response, { method: 'GET', path });
  },

  /**
   * Get aggregate progress statistics for the active programme
   */
  getProgressSummary: async (signal?: AbortSignal): Promise<ProgressSummaryResponse> => {
    const path = `${basePath}/active/progress`;
    const response = await ffpClient.get(path, { signal });

    return parseApiResponse(progressSummaryResponseSchema, response, { method: 'GET', path });
  },

  /**
   * Replace the active programme with the recommendation from a reassessment.
   * Archives the current programme and creates a new one.
   */
  replaceActive: async (assessmentId: string): Promise<ReplaceProgrammeResponse> => {
    const path = `${basePath}/active/replace`;
    const response = await ffpClient.put(path, { assessmentId });

    return parseApiResponse(replaceProgrammeResponseSchema, response, { method: 'PUT', path });
  },
};

// Re-export types for consumers
export type {
  ActiveProgrammeResponse,
  ProgrammeDetailResponse,
  ProgressSummaryResponse,
  ReplaceProgrammeResponse,
};
