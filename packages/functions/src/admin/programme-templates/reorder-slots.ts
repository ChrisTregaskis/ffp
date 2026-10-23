import type { SessionSlotsResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  templateSlotService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/**
 * Lambda handler for PUT /admin/sessions/{id}/slots/reorder
 *
 * Reorders a template session's slots. Accepts every slot's publicId in the new order.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can reorder session slots',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<SessionSlotsResponse> => {
      const sessionId = event.pathParameters?.id;

      if (!sessionId) {
        throw new ValidationError('Session ID is required');
      }

      const body = parseJsonBody(event.body);

      return await templateSlotService.reorderSlots(sessionId, body);
    }
  )
);
