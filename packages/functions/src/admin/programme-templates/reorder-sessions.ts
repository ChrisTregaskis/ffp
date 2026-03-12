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

interface ReorderSessionsResponse {
  sessions: SessionResponse[];
}

/**
 * Lambda handler for PUT /admin/phases/{id}/sessions/reorder
 *
 * Reorders sessions within a template phase.
 * Accepts an array of session IDs in the desired order.
 * Admin role required.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ReorderSessionsResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can reorder template sessions');
    }

    const phaseId = event.pathParameters?.id;

    if (!phaseId) {
      throw new ValidationError('Phase ID is required');
    }

    const body = parseJsonBody(event.body);
    const sessions = await templateSessionService.reorderSessions(phaseId, body);

    return { sessions };
  }
);
