import {
  sessionParamsSchema,
  userSessionResponseSchema,
  type UserSessionResponse,
} from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  sessionService,
  ValidationError,
} from '@ffp/core/server';

/**
 * Lambda handler for PUT /sessions/{id}/pause
 * Pauses an in-progress session (sets pausedAt, status stays in_progress).
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<UserSessionResponse> => {
    const context = extractUserContext(event);

    const params = sessionParamsSchema.safeParse(event.pathParameters);

    if (!params.success) {
      throw new ValidationError(params.error.message);
    }

    const session = await sessionService.pauseSession(params.data.id, context);

    return userSessionResponseSchema.parse(session);
  }
);
