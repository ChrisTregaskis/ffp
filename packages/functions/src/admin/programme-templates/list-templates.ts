import {
  paginationInputSchema,
  templateListQuerySchema,
  type TemplateListResponse,
  type PaginationMeta,
} from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  programmeTemplateService,
} from '@ffp/core/server';

interface ListTemplatesResponse {
  data: TemplateListResponse[];
  pagination: PaginationMeta;
}

/**
 * Lambda handler for GET /admin/programme-templates
 *
 * Lists all programme templates with pagination, search, and filters.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can list programme templates',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<ListTemplatesResponse> => {
      const params = event.queryStringParameters ?? {};

      const paginationInput = paginationInputSchema.parse(params);

      const query = templateListQuerySchema.parse(params);

      const filters = {
        search: query.search,
        difficulty: query.difficulty,
        isActive: query.isActive,
      };

      return await programmeTemplateService.listTemplates(paginationInput, filters);
    }
  )
);
