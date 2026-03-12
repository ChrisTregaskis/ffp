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

import { parseJsonBody } from '../../lib/request-body';

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

    const body = parseJsonBody(event.body);
    const phases = await templatePhaseService.reorderPhases(templateId, body);

    return { phases };
  }
);
