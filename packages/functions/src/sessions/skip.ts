import {
  sessionParamsSchema,
  sessionStatusResponseSchema,
  type SessionStatusResponse,
} from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  sessionService,
  ValidationError,
} from '@ffp/core/server';

/**
 * Lambda handler for PUT /sessions/{id}/skip
 * Skips a session and triggers cascading completion.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<SessionStatusResponse> => {
    const context = extractUserContext(event);

    const params = sessionParamsSchema.safeParse(event.pathParameters);

    if (!params.success) {
      throw new ValidationError(params.error.message);
    }

    const result = await sessionService.skipSession(params.data.id, context);

    return sessionStatusResponseSchema.parse(result);
  }
);
