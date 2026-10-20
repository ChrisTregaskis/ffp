import { z } from 'zod';

import type {
  CreateSessionRequest,
  ReorderSessionsRequest,
  SessionResponse,
  UpdateSessionRequest,
} from '@ffp/core';
import { sessionResponseSchema } from '@ffp/core';

import { assertUuidPathParam, ffpClient, parseApiResponse } from '../../client';

const sessionResponseEnvelope = z.object({ session: sessionResponseSchema });
const sessionsResponseEnvelope = z.object({ sessions: z.array(sessionResponseSchema) });

/** Session CRUD + reorder within a template phase. */
export const adminSessionsApi = {
  /** Creates a new session within a phase. */
  create: async (phaseId: string, data: CreateSessionRequest): Promise<SessionResponse> => {
    const checkedPhaseId = assertUuidPathParam(phaseId, 'POST /admin/phases/{phaseId}/sessions');
    const path = `/admin/phases/${checkedPhaseId}/sessions`;
    const response = await ffpClient.post(path, data);

    return parseApiResponse(sessionResponseEnvelope, response, { method: 'POST', path }).session;
  },

  /** Updates a session (partial update). */
  update: async (sessionId: string, data: UpdateSessionRequest): Promise<SessionResponse> => {
    const checkedSessionId = assertUuidPathParam(sessionId, 'PUT /admin/sessions/{sessionId}');
    const path = `/admin/sessions/${checkedSessionId}`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(sessionResponseEnvelope, response, { method: 'PUT', path }).session;
  },

  /** Deletes a session and renumbers siblings. */
  delete: async (sessionId: string): Promise<void> => {
    const checkedSessionId = assertUuidPathParam(sessionId, 'DELETE /admin/sessions/{sessionId}');
    const path = `/admin/sessions/${checkedSessionId}`;
    await ffpClient.delete(path);
  },

  /** Reorders sessions within a phase. */
  reorder: async (phaseId: string, data: ReorderSessionsRequest): Promise<SessionResponse[]> => {
    const checkedPhaseId = assertUuidPathParam(
      phaseId,
      'PUT /admin/phases/{phaseId}/sessions/reorder'
    );
    const path = `/admin/phases/${checkedPhaseId}/sessions/reorder`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(sessionsResponseEnvelope, response, { method: 'PUT', path }).sessions;
  },
};

export type { CreateSessionRequest, ReorderSessionsRequest, SessionResponse, UpdateSessionRequest };
