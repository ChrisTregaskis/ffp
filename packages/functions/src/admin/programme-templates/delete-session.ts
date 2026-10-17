import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
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
  withSystemAdmin(
    'Only system administrators can delete template sessions',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<null> => {
      const sessionId = event.pathParameters?.id;

      if (!sessionId) {
        throw new ValidationError('Session ID is required');
      }

      await templateSessionService.deleteSession(sessionId);

      return null;
    }
  )
);
