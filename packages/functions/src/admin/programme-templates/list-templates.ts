import { paginationInputSchema, templateListQuerySchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  isUserActor,
  programmeTemplateService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/programme-templates
 *
 * Lists all programme templates with pagination, search, and filters.
 */
export const handler = withErrorHandling(async (event: APIGatewayProxyEventV2WithJWT) => {
  const context = extractUserContext(event);

  if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system administrators can list programme templates');
  }

  const params = event.queryStringParameters ?? {};

  const paginationInput = paginationInputSchema.parse({
    page: params.page,
    pageSize: params.pageSize,
    sortBy: params.sortBy,
    sortDirection: params.sortDirection,
  });

  const query = templateListQuerySchema.parse(params);

  const filters = {
    search: query.search,
    difficulty: query.difficulty,
    isActive: query.isActive,
  };

  return await programmeTemplateService.listTemplates(paginationInput, filters);
});
