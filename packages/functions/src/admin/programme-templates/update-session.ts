import type { SessionResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  ValidationError,
  isUserActor,
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
  async (event: APIGatewayProxyEventV2WithJWT): Promise<UpdateSessionResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can update template sessions');
    }

    const sessionId = event.pathParameters?.id;

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    const body = parseJsonBody(event.body);
    const session = await templateSessionService.updateSession(sessionId, body);

    return { session };
  }
);
