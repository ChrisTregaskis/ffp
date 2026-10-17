import { paginationInputSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  listOrganisationsService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/organisations
 *
 * Lists all organisations with pagination and search. Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can list organisations',
    async (event: APIGatewayProxyEventV2WithJWT, context) => {
      const params = event.queryStringParameters ?? {};

      const paginationInput = paginationInputSchema.parse(params);

      const rawFilters = {
        search: params.search ?? undefined,
        status: params.status ?? undefined,
      };

      return await listOrganisationsService(context, paginationInput, rawFilters);
    }
  )
);
