import { paginationInputSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  isUserActor,
  listLocationsService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/locations
 *
 * Lists all locations with pagination, search, status, and organisation filter.
 * Admin role required.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEventV2WithJWT) => {
  const context = extractUserContext(event);

  if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system administrators can list locations');
  }

  const params = event.queryStringParameters ?? {};

  const paginationInput = paginationInputSchema.parse({
    page: params.page,
    pageSize: params.pageSize,
    sortBy: params.sortBy,
    sortDirection: params.sortDirection,
  });

  const rawFilters = {
    search: params.search ?? undefined,
    status: params.status ?? undefined,
    organisationId: params.organisationId ?? undefined,
  };

  return await listLocationsService(context, paginationInput, rawFilters);
});
