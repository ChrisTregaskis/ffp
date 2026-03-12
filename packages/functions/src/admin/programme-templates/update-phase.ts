import type { PhaseResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  ValidationError,
  isUserActor,
  templatePhaseService,
} from '@ffp/core/server';

interface UpdatePhaseResponse {
  phase: PhaseResponse;
}

/**
 * Lambda handler for PUT /admin/phases/{id}
 *
 * Updates a template phase. Supports partial updates (name, description).
 * Admin role required.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<UpdatePhaseResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can update template phases');
    }

    const phaseId = event.pathParameters?.id;

    if (!phaseId) {
      throw new ValidationError('Phase ID is required');
    }

    if (!event.body) {
      throw new ValidationError('Request body is required');
    }

    let body: unknown;

    try {
      body = JSON.parse(event.body);
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    const phase = await templatePhaseService.updatePhase(phaseId, body);

    return { phase };
  }
);
