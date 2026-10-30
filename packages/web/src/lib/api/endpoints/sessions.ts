import {
  startSessionResponseSchema,
  sessionStatusResponseSchema,
  type StartSessionRequest,
  type StartSessionResponse,
  type SessionStatusResponse,
} from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const basePath = '/sessions';

/**
 * Session lifecycle API methods
 */
export const sessionsApi = {
  /** Start a session — moves it to in_progress and creates its exercise_completions (idempotent) */
  start: async (input: StartSessionRequest): Promise<StartSessionResponse> => {
    const path = `${basePath}/start`;
    const response = await ffpClient.post(path, input);

    return parseApiResponse(startSessionResponseSchema, response, { method: 'POST', path });
  },

  /** Mark a session as completed*/
  complete: async (sessionId: string): Promise<SessionStatusResponse> => {
    const path = `${basePath}/${sessionId}/complete`;
    const response = await ffpClient.put(path);

    return parseApiResponse(sessionStatusResponseSchema, response, { method: 'PUT', path });
  },
};
