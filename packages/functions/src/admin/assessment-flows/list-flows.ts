import {
  assessmentFlowListFiltersSchema,
  paginationInputSchema,
  type AssessmentFlowListItem,
  type PaginationMeta,
} from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  isUserActor,
  flowService,
} from '@ffp/core/server';

interface ListFlowsResponse {
  data: AssessmentFlowListItem[];
  pagination: PaginationMeta;
}

/**
 * Lambda handler for GET /admin/assessment-flows
 *
 * Lists assessment flows with pagination, search, sort and a status filter.
 * Query params: page, pageSize, sortBy, sortDirection, search, isActive.
 * Requires the system_admin role, matching every write verb on this resource —
 * the isActive filter lets a caller enumerate retired flows deliberately.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ListFlowsResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can list assessment flows');
    }

    const params = event.queryStringParameters ?? {};

    const paginationInput = paginationInputSchema.parse({
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    });

    const filters = assessmentFlowListFiltersSchema.parse({
      search: params.search,
      isActive: params.isActive,
    });

    return await flowService.listFlowsService(context, paginationInput, filters);
  }
);
