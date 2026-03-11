import { paginationInputSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  isUserActor,
  listAdminVideos,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/videos
 *
 * Lists all videos (draft, active, archived) with pagination, search, and filters.
 * Query params: page, pageSize, sortBy, sortDirection, search, status, difficulty.
 * Admin role required.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEventV2WithJWT) => {
  const context = extractUserContext(event);

  if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system administrators can list admin videos');
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
    difficulty: params.difficulty ?? undefined,
  };

  return await listAdminVideos(context, paginationInput, rawFilters);
});
