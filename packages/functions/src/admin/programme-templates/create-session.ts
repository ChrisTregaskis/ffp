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

interface CreateSessionResponse {
  session: SessionResponse;
}

/**
 * Lambda handler for POST /admin/phases/{id}/sessions
 *
 * Creates a new session within a template phase.
 * Auto-assigns sessionNumber and updates phase sessionCount.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<CreateSessionResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can create template sessions');
    }

    const phaseId = event.pathParameters?.id;

    if (!phaseId) {
      throw new ValidationError('Phase ID is required');
    }

    const body = parseJsonBody(event.body, { required: false });
    const session = await templateSessionService.createSession(phaseId, body);

    return { session };
  }
);
