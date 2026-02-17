import { activeProgrammeResponseSchema, type ActiveProgrammeResponse } from '@ffp/core';

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
};

// Re-export types for consumers
export type { ActiveProgrammeResponse };
