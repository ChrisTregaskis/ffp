import { type CreateOrganisationResponse, createOrganisationRequestSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
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
  withSystemAdmin(
    'Only system admins can create organisations',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<CreateOrganisationResponse> => {
      const body = JSON.parse(event.body ?? '{}') as unknown;
      const input = createOrganisationRequestSchema.parse(body);

      const ctx = createRequestContext(context);

      return await createOrganisationService(ctx, input);
    }
  )
);
