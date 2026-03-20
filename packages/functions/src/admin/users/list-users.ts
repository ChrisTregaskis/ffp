import { paginationInputSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  isUserActor,
  listUsersService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/users
 *
 * Lists all programme users with pagination, search, and customer filter.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEventV2WithJWT) => {
  const context = extractUserContext(event);

  if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system administrators can list users');
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
    customerId: params.customerId ?? undefined,
  };

  return await listUsersService(context, paginationInput, rawFilters);
});
