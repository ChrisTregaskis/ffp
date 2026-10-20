import {
  paginationInputSchema,
  questionListFiltersSchema,
  type AdminQuestion,
  type PaginationMeta,
} from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  questionService,
} from '@ffp/core/server';

interface ListQuestionsResponse {
  data: AdminQuestion[];
  pagination: PaginationMeta;
}

/**
 * GET /admin/questions — list question bank entries with pagination, search
 * (question text and slug), sort and type / status filters.
 * Query params: page, pageSize, sortBy, sortDirection, search, type, isActive.
 * Requires the system_admin role.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can list questions',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<ListQuestionsResponse> => {
      const params = event.queryStringParameters ?? {};

      const paginationInput = paginationInputSchema.parse(params);

      const filters = questionListFiltersSchema.parse(params);

      return await questionService.listQuestionsService(context, paginationInput, filters);
    }
  )
);
