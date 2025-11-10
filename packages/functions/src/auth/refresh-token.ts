import { refreshTokenSchema } from '@ffp/core';
import {
  type RefreshTokenResult,
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  refreshTokenService,
} from '@ffp/core/server';

/**
 * Lambda handler for POST /auth/refresh-token
 *
 * Public endpoint (no JWT required) that refreshes authentication tokens.
 *
 * Uses a valid refresh token to obtain new access and ID tokens without
 * requiring the user to re-authenticate. The refresh token itself does not
 * rotate and remains valid for 30 days.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<RefreshTokenResult> => {
    // Parse and validate request body
    const body = JSON.parse(event.body ?? '{}') as unknown;
    const input = refreshTokenSchema.parse(body);

    // Refresh tokens via service
    const result = await refreshTokenService(input);

    return result;
  }
);
