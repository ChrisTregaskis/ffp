import { paginationInputSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  listUsersService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/users
 *
 * Lists all programme users with pagination, search, and location filter.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can list users',
    async (event: APIGatewayProxyEventV2WithJWT, context) => {
      const params = event.queryStringParameters ?? {};

      const paginationInput = paginationInputSchema.parse(params);

      const rawFilters = {
        search: params.search ?? undefined,
        locationId: params.locationId ?? undefined,
        role: params.role ?? undefined,
      };

      return await listUsersService(context, paginationInput, rawFilters);
    }
  )
);
