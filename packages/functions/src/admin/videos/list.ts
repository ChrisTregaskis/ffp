import { paginationInputSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  listAdminVideos,
} from '@ffp/core/server';

import { parseArrayParam } from '../../lib/query-params';

/**
 * Lambda handler for GET /admin/videos
 *
 * Lists all videos (draft, active, archived) with pagination, search, and filters.
 * Query params: page, pageSize, sortBy, sortDirection, search, status, difficulty,
 * tags (comma-separated tag publicIds; any match).
 * Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can list admin videos',
    async (event: APIGatewayProxyEventV2WithJWT, context) => {
      const params = event.queryStringParameters ?? {};

      const paginationInput = paginationInputSchema.parse(params);

      const rawFilters = {
        search: params.search ?? undefined,
        status: params.status ?? undefined,
        difficulty: params.difficulty ?? undefined,
        tags: parseArrayParam(params.tags),
      };

      return await listAdminVideos(context, paginationInput, rawFilters);
    }
  )
);
