import { z } from 'zod';

import type {
  CreateSessionRequest,
  ReorderSessionsRequest,
  SessionResponse,
  UpdateSessionRequest,
} from '@ffp/core';
import { sessionResponseSchema } from '@ffp/core';

import { ffpClient, parseApiResponse } from '../../client';

const sessionResponseEnvelope = z.object({ session: sessionResponseSchema });
const sessionsResponseEnvelope = z.object({ sessions: z.array(sessionResponseSchema) });

/** Session CRUD + reorder within a template phase. */
export const adminSessionsApi = {
  /** Creates a new session within a phase. */
  create: async (phaseId: string, data: CreateSessionRequest): Promise<SessionResponse> => {
    const path = `/admin/phases/${phaseId}/sessions`;
    const response = await ffpClient.post(path, data);

    return parseApiResponse(sessionResponseEnvelope, response, { method: 'POST', path }).session;
  },

  /** Updates a session (partial update). */
  update: async (sessionId: string, data: UpdateSessionRequest): Promise<SessionResponse> => {
    const path = `/admin/sessions/${sessionId}`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(sessionResponseEnvelope, response, { method: 'PUT', path }).session;
  },

  /** Deletes a session and renumbers siblings. */
  delete: async (sessionId: string): Promise<void> => {
    const path = `/admin/sessions/${sessionId}`;
    await ffpClient.delete(path);
  },

  /** Reorders sessions within a phase. */
  reorder: async (phaseId: string, data: ReorderSessionsRequest): Promise<SessionResponse[]> => {
    const path = `/admin/phases/${phaseId}/sessions/reorder`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(sessionsResponseEnvelope, response, { method: 'PUT', path }).sessions;
  },
};

export type { CreateSessionRequest, ReorderSessionsRequest, SessionResponse, UpdateSessionRequest };
