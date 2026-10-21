import { z } from 'zod';

import type {
  CreateSlotRequest,
  ReorderSlotsRequest,
  SessionSlotsResponse,
  SlotResponse,
  UpdateSlotRequest,
} from '@ffp/core';
import { sessionSlotsResponseSchema, slotResponseSchema } from '@ffp/core';

import { assertUuidPathParam, ffpClient, parseApiResponse } from '../../client';

const slotResponseEnvelope = z.object({ slot: slotResponseSchema });

/** Slot CRUD + reorder within a template session; a slot's own routes take its publicId. */
export const adminSlotsApi = {
  /** Lists a session's slots with their live pool sizes and warnings. */
  list: async (sessionId: string): Promise<SessionSlotsResponse> => {
    const checkedSessionId = assertUuidPathParam(
      sessionId,
      'GET /admin/sessions/{sessionId}/slots'
    );
    const path = `/admin/sessions/${checkedSessionId}/slots`;
    const response = await ffpClient.get(path);

    return parseApiResponse(sessionSlotsResponseSchema, response, { method: 'GET', path });
  },

  /** Adds a slot at the end of a session; a sixth is refused. */
  create: async (sessionId: string, data: CreateSlotRequest): Promise<SlotResponse> => {
    const checkedSessionId = assertUuidPathParam(
      sessionId,
      'POST /admin/sessions/{sessionId}/slots'
    );
    const path = `/admin/sessions/${checkedSessionId}/slots`;
    const response = await ffpClient.post(path, data);

    return parseApiResponse(slotResponseEnvelope, response, { method: 'POST', path }).slot;
  },

  /** Updates a slot (partial update). */
  update: async (publicId: string, data: UpdateSlotRequest): Promise<SlotResponse> => {
    const path = `/admin/slots/${publicId}`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(slotResponseEnvelope, response, { method: 'PUT', path }).slot;
  },

  /** Deletes a slot and renumbers its siblings. */
  delete: async (publicId: string): Promise<void> => {
    await ffpClient.delete(`/admin/slots/${publicId}`);
  },

  /** Reorders a session's slots by publicId. */
  reorder: async (sessionId: string, data: ReorderSlotsRequest): Promise<SessionSlotsResponse> => {
    const checkedSessionId = assertUuidPathParam(
      sessionId,
      'PUT /admin/sessions/{sessionId}/slots/reorder'
    );
    const path = `/admin/sessions/${checkedSessionId}/slots/reorder`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(sessionSlotsResponseSchema, response, { method: 'PUT', path });
  },
};

export type {
  CreateSlotRequest,
  ReorderSlotsRequest,
  SessionSlotsResponse,
  SlotResponse,
  UpdateSlotRequest,
};
