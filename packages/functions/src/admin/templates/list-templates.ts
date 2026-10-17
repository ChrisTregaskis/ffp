import {
  assessmentTemplateListFiltersSchema,
  paginationInputSchema,
  type AssessmentTemplateListItem,
  type PaginationMeta,
} from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  templateService,
  ForbiddenError,
  isUserActor,
} from '@ffp/core/server';

interface ListTemplatesResponse {
  data: AssessmentTemplateListItem[];
  pagination: PaginationMeta;
}

/**
 * Lambda handler for GET /admin/assessment-templates
 *
 * Lists assessment templates with pagination, search (name and description),
 * sort and a status filter. Query params: page, pageSize, sortBy, sortDirection,
 * search, isActive. Requires the system_admin role, matching every other verb on
 * this resource.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ListTemplatesResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can list assessment templates');
    }

    const params = event.queryStringParameters ?? {};

    const paginationInput = paginationInputSchema.parse(params);

    const filters = assessmentTemplateListFiltersSchema.parse(params);

    return await templateService.listTemplatesService(context, paginationInput, filters);
  }
);
