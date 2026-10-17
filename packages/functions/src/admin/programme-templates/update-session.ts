import type { SessionResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  templateSessionService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface UpdateSessionResponse {
  session: SessionResponse;
}

/**
 * Lambda handler for PUT /admin/sessions/{id}
 *
 * Updates a template session. Supports partial updates
 * (name, description, estimatedDurationMinutes).
 * Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can update template sessions',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<UpdateSessionResponse> => {
      const sessionId = event.pathParameters?.id;

      if (!sessionId) {
        throw new ValidationError('Session ID is required');
      }

      const body = parseJsonBody(event.body);
      const session = await templateSessionService.updateSession(sessionId, body);

      return { session };
    }
  )
);
