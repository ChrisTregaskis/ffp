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
 * Lambda handler for POST /admin/organisations
 *
 * Creates a new organisation (business entity). Admin role required.
 *
 * Request body:
 * ```json
 * { "organisationName": "Sunrise Care Group" }
 * ```
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<CreateOrganisationResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system admins can create organisations');
    }

    const body = JSON.parse(event.body ?? '{}') as unknown;
    const input = createOrganisationRequestSchema.parse(body);

    const ctx = createRequestContext(context);

    return await createOrganisationService(ctx, input);
  }
);
