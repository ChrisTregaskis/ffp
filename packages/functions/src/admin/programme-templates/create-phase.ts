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

    let body: unknown = {};

    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch {
        throw new ValidationError('Invalid JSON in request body');
      }
    }

    const phase = await templatePhaseService.createPhase(templateId, body);

    return { phase };
  }
);
