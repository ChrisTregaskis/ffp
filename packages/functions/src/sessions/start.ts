import {
  startSessionRequestSchema,
  startSessionResponseSchema,
  type StartSessionResponse,
} from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  sessionService,
  ValidationError,
} from '@ffp/core/server';

/**
 * Lambda handler for POST /sessions/start
 * Lazily creates a user session with exercise completions (idempotent).
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<StartSessionResponse> => {
    const context = extractUserContext(event);

    const body = JSON.parse(event.body ?? '{}') as unknown;
    const input = startSessionRequestSchema.safeParse(body);

    if (!input.success) {
      throw new ValidationError(input.error.message);
    }

    const result = await sessionService.startSession(input.data, context);

    return startSessionResponseSchema.parse(result);
  }
);
