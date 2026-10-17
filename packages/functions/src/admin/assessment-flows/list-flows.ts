import {
  assessmentFlowListFiltersSchema,
  paginationInputSchema,
  type AssessmentFlowListItem,
  type PaginationMeta,
} from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
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
  withSystemAdmin(
    'Only system administrators can list assessment flows',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<ListFlowsResponse> => {
      const params = event.queryStringParameters ?? {};

      const paginationInput = paginationInputSchema.parse(params);

      const filters = assessmentFlowListFiltersSchema.parse(params);

      return await flowService.listFlowsService(context, paginationInput, filters);
    }
  )
);
