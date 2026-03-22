import { type CreateOrganisationResponse, createOrganisationRequestSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  isUserActor,
  createOrganisationService,
  createRequestContext,
} from '@ffp/core/server';

/**
 * Lambda handler for POST /admin/create-customer
 *
 * DEPRECATED: This endpoint will be replaced by separate
 * POST /admin/organisations and POST /admin/organisations/:orgId/locations
 * endpoints in FFP-521.
 *
 * Currently creates an organisation only (no longer creates a location).
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<CreateOrganisationResponse> => {
    // Extract user context from JWT (throws UnauthorisedError if missing)
    const context = extractUserContext(event);

    // Validate system_admin role
    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system admins can create organisations');
    }

    // Parse and validate request body
    const body = JSON.parse(event.body ?? '{}') as unknown;
    const input = createOrganisationRequestSchema.parse(body);

    // Create unified request context (db + organisation context)
    const ctx = createRequestContext(context);

    // Create organisation via service
    const result = await createOrganisationService(ctx, input);

    return result;
  }
);
