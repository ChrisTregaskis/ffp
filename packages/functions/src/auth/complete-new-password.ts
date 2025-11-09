import { completeNewPasswordSchema } from '@ffp/core';
import {
  type CompleteNewPasswordResponse,
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  completeNewPasswordService,
} from '@ffp/core/server';

/**
 * Lambda handler for POST /auth/complete-new-password
 *
 * Public endpoint (no JWT required) that completes the NEW_PASSWORD_REQUIRED
 * challenge for users with temporary passwords.
 *
 * Called after /auth/login returns a NEW_PASSWORD_REQUIRED challenge.
 * Sets the user's permanent password and returns JWT tokens for immediate use.
 *
 * Flow:
 * 1. User calls /auth/login with temporary password
 * 2. Response includes { challengeName: 'NEW_PASSWORD_REQUIRED', session: '...', email: '...' }
 * 3. User calls this endpoint with { session, email, newPassword }
 * 4. Password is set and user receives JWT tokens
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<CompleteNewPasswordResponse> => {
    // Parse and validate request body
    const body = JSON.parse(event.body ?? '{}') as unknown;
    const input = completeNewPasswordSchema.parse(body);

    // Complete password change via service
    const result = await completeNewPasswordService(input);

    return result;
  }
);
