import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  ValidationError,
  isUserActor,
  templateSessionService,
} from '@ffp/core/server';

/**
 * Lambda handler for DELETE /admin/sessions/{id}
 *
 * Deletes a template session and cascades to child exercises.
 * Updates phase sessionCount and re-numbers remaining sessions.
 * Returns 200 with null on success (204 deferred — see withErrorHandling limitation).
 * Admin role required.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<null> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can delete template sessions');
    }

    const sessionId = event.pathParameters?.id;

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    await templateSessionService.deleteSession(sessionId);

    return null;
  }
);
