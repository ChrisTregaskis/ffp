import type { SlotResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  templateSlotService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface UpdateSlotResponse {
  slot: SlotResponse;
}

/**
 * Lambda handler for PUT /admin/slots/{publicId}
 *
 * Updates a template session slot. Supports partial updates.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can update session slots',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<UpdateSlotResponse> => {
      const publicId = event.pathParameters?.publicId;

      if (!publicId) {
        throw new ValidationError('Slot ID is required');
      }

      const body = parseJsonBody(event.body);
      const slot = await templateSlotService.updateSlot(publicId, body);

      return { slot };
    }
  )
);
