import { loginSchema } from '@ffp/core';
import {
  type LoginResult,
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  loginService,
} from '@ffp/core/server';

/**
 * Lambda handler for POST /auth/login
 *
 * Public endpoint (no JWT required) that authenticates users via Cognito.
 *
 * Handles two scenarios:
 * 1. Regular login - Returns access token, ID token, and refresh token
 * 2. Temporary password - Returns NEW_PASSWORD_REQUIRED challenge with session
 *
 * Users with temporary passwords (from /auth/invite-user) must change their
 * password before accessing the platform.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<LoginResult> => {
    // Parse and validate request body
    const body = JSON.parse(event.body ?? '{}') as unknown;
    const input = loginSchema.parse(body);

    // Authenticate user via service
    const result = await loginService(input);

    return result;
  }
);
