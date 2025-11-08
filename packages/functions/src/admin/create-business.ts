import { createBusinessSchema } from '@ffp/core';
import {
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  isUserActor,
  createBusinessService,
} from '@ffp/core/server';
import { getDb } from '@ffp/database';

import type { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * Lambda handler for POST /admin/create-business
 *
 * Protected endpoint that requires JWT authentication and system_admin role.
 * Creates both tenant and customer records in a single transaction.
 *
 * Request body:
 * ```json
 * {
 *   "businessName": "Acme Physiotherapy"
 * }
 * ```
 *
 * Response (200):
 * ```json
 * {
 *   "tenantId": "uuid",
 *   "customerId": "uuid",
 *   "businessName": "Acme Physiotherapy"
 * }
 * ```
 *
 * Error responses:
 * - 401: Authentication failed (no valid JWT)
 * - 403: Forbidden (user is not a system_admin)
 * - 400: Validation error (invalid request body)
 * - 500: Internal server error
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  // Extract user context from JWT (throws UnauthorisedError if missing)
  const context = extractUserContext(event);

  // Validate system_admin role
  if (!isUserActor(context.actor)) {
    throw new ForbiddenError('Only system admins can create businesses');
  }

  if (context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system admins can create businesses');
  }

  // Parse and validate request body
  const body = JSON.parse(event.body ?? '{}') as unknown;
  const input = createBusinessSchema.parse(body);

  // Get privileged database connection (no RLS context needed)
  const db = getDb();

  // Create business via service
  const result = await createBusinessService(db, context, input); // TODO: I'd rather not pass in the db and context to every single service. Is there a way we can make it so every service has access to the db and tenant context without having to pass through params? This way, keeping params cleaner?

  return result;
});
