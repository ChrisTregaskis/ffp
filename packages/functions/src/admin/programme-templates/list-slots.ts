import type { SessionSlotsResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  templateSlotService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/sessions/{id}/slots
 *
 * Returns a template session's slots in order, each with its live pool size and warnings.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can view session slots',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<SessionSlotsResponse> => {
      const sessionId = event.pathParameters?.id;

      if (!sessionId) {
        throw new ValidationError('Session ID is required');
      }

      return await templateSlotService.listSlots(sessionId);
    }
  )
);
