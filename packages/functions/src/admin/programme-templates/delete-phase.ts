import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  ValidationError,
  isUserActor,
  templatePhaseService,
} from '@ffp/core/server';

/**
 * Lambda handler for DELETE /admin/phases/{id}
 *
 * Deletes a template phase and cascades to child sessions and exercises.
 * Updates template totalPhases and re-numbers remaining phases.
 * Returns 204 No Content on success.
 * Admin role required.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<null> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can delete template phases');
    }

    const phaseId = event.pathParameters?.id;

    if (!phaseId) {
      throw new ValidationError('Phase ID is required');
    }

    await templatePhaseService.deletePhase(phaseId);

    return null;
  }
);
