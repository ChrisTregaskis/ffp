import { paginationInputSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  listLocationsService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/locations
 *
 * Lists all locations with pagination, search, status, and organisation filter.
 * Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can list locations',
    async (event: APIGatewayProxyEventV2WithJWT, context) => {
      const params = event.queryStringParameters ?? {};

      const paginationInput = paginationInputSchema.parse(params);

      const rawFilters = {
        search: params.search ?? undefined,
        status: params.status ?? undefined,
        organisationId: params.organisationId ?? undefined,
      };

      return await listLocationsService(context, paginationInput, rawFilters);
    }
  )
);
