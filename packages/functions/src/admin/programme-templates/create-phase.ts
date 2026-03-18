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

interface CreatePhaseResponse {
  phase: PhaseResponse;
}

/**
 * Lambda handler for POST /admin/programme-templates/{id}/phases
 *
 * Creates a new phase within a programme template.
 * Auto-assigns phaseNumber and updates template totalPhases.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<CreatePhaseResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can create template phases');
    }

    const templateId = event.pathParameters?.id;

    if (!templateId) {
      throw new ValidationError('Template ID is required');
    }

    const body = parseJsonBody(event.body, { required: false });
    const phase = await templatePhaseService.createPhase(templateId, body);

    return { phase };
  }
);
