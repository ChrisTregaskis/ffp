import { paginationInputSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  isUserActor,
  listOrganisationsService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/organisations
 *
 * Lists all organisations with pagination and search. Admin role required.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEventV2WithJWT) => {
  const context = extractUserContext(event);

  if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system administrators can list organisations');
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
  };

  return await listOrganisationsService(context, paginationInput, rawFilters);
});
