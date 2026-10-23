import type { SlotResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  templateSlotService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface CreateSlotResponse {
  slot: SlotResponse;
}

/**
 * Lambda handler for POST /admin/sessions/{id}/slots
 *
 * Adds a slot at the end of a template session.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can create session slots',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<CreateSlotResponse> => {
      const sessionId = event.pathParameters?.id;

      if (!sessionId) {
        throw new ValidationError('Session ID is required');
      }

      const body = parseJsonBody(event.body);
      const slot = await templateSlotService.createSlot(sessionId, body);

      return { slot };
    }
  )
);
