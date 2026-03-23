import { inviteUserSchema } from '@ffp/core';
import {
  type InviteUserResponse,
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  inviteUserService,
  createRequestContext,
} from '@ffp/core/server';

/**
 * Lambda handler for POST /auth/invite-user
 *
 * Protected endpoint that requires JWT authentication.
 * Supports two modes:
 * 1. customer_owner: Invites users to their own organisation/location (context from JWT)
 * 2. system_admin: Can invite users to ANY organisation/location (must specify in request)
 *
 * Creates Cognito user with temporary password and database record.
 * Implements rollback pattern: if database fails, Cognito user is deleted.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<InviteUserResponse> => {
    // Extract user context from JWT (throws UnauthorisedError if missing)
    const context = extractUserContext(event);

    // Parse and validate request body
    const body = JSON.parse(event.body ?? '{}') as unknown;
    const input = inviteUserSchema.parse(body);

    // Create unified request context (db + organisation context)
    const ctx = createRequestContext(context);

    // Invite user via service
    const result = await inviteUserService(ctx, input);

    return result;
  }
);
