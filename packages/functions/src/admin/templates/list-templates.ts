import type { AssessmentTemplate } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  templateService,
} from '@ffp/core/server';

/**
 * Response type for list templates endpoint
 */
interface ListTemplatesResponse {
  templates: AssessmentTemplate[];
  count: number;
}

/**
 * Lambda handler for GET /admin/assessment-templates
 *
 * Protected endpoint that requires JWT authentication.
 * Returns all assessment templates. Any authenticated user can view templates.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ListTemplatesResponse> => {
    // Extract user context from JWT (validates authentication)
    const context = extractUserContext(event);

    // Parse query parameters
    const activeOnly = event.queryStringParameters?.activeOnly === 'true';

    // Service functions consistently take ctx as first parameter
    const templates = await templateService.listTemplatesService(context, { activeOnly });

    return {
      templates,
      count: templates.length,
    };
  }
);
