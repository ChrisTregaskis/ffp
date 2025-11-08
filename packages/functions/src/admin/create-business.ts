import { type CreateBusinessResponse, createBusinessSchema } from '@ffp/core';
import {
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  isUserActor,
  createBusinessService,
  createRequestContext,
  InternalServerError,
} from '@ffp/core/server';

import type { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Lambda handler for POST /admin/create-business
 *
 * Protected endpoint that requires JWT authentication and system_admin role.
 * Creates both tenant and customer records in a single transaction.
 *
 * Request body:
 * ```json
 * { "businessName": "Sunshine Carehome" }
 * ```
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2<CreateBusinessResponse>> => {
    try {
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

      // Create unified request context (db + tenant context)
      const ctx = createRequestContext(context);

      // Create business via service
      const result = await createBusinessService(ctx, input);

      return result;
    } catch (error) {
      throw new InternalServerError(
        `Failed to create business: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);
