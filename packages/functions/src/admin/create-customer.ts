import { type CreateCustomerResponse, createCustomerSchema } from '@ffp/core';
import {
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  isUserActor,
  createCustomerService,
  createRequestContext,
} from '@ffp/core/server';

import type { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Lambda handler for POST /admin/create-customer
 *
 * Protected endpoint that requires JWT authentication and system_admin role.
 * Creates both tenant and customer records in a single transaction.
 *
 * Note: "customer" represents a business/care home organisation in the system.
 *
 * Request body:
 * ```json
 * { "customerName": "Sunshine Carehome" }
 * ```
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2<CreateCustomerResponse>> => {
    // Extract user context from JWT (throws UnauthorisedError if missing)
    const context = extractUserContext(event);

    // Validate system_admin role
    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system admins can create customers');
    }
    // Parse and validate request body
    // Both V1 and V2 events have a `body` property (string | null)
    const body = JSON.parse(event.body ?? '{}') as unknown;
    const input = createCustomerSchema.parse(body);

    // Create unified request context (db + tenant context)
    const ctx = createRequestContext(context);

    // Create customer via service
    const result = await createCustomerService(ctx, input);

    return result;
  }
);
