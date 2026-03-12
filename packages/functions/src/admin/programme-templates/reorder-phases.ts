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

interface ReorderPhasesResponse {
  phases: PhaseResponse[];
}

/**
 * Lambda handler for PUT /admin/programme-templates/{id}/phases/reorder
 *
 * Reorders phases within a programme template.
 * Accepts an array of phase IDs in the desired order.
 * Admin role required.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ReorderPhasesResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can reorder template phases');
    }

    const templateId = event.pathParameters?.id;

    if (!templateId) {
      throw new ValidationError('Template ID is required');
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

    const phases = await templatePhaseService.reorderPhases(templateId, body);

    return { phases };
  }
);
