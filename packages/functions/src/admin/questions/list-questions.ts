import {
  paginationInputSchema,
  questionListFiltersSchema,
  type AdminQuestion,
  type PaginationMeta,
} from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  questionService,
  ForbiddenError,
  isUserActor,
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
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ListQuestionsResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can list questions');
    }

    const params = event.queryStringParameters ?? {};

    const paginationInput = paginationInputSchema.parse(params);

    const filters = questionListFiltersSchema.parse(params);

    return await questionService.listQuestionsService(context, paginationInput, filters);
  }
);
