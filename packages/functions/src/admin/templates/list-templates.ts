import type { AssessmentTemplate } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  templateService,
  ForbiddenError,
  isUserActor,
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
 * Returns all assessment templates. Requires the system_admin role, matching
 * every other verb on this resource.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ListTemplatesResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can list assessment templates');
    }

    const activeOnly = event.queryStringParameters?.activeOnly === 'true';

    // Service functions consistently take ctx as first parameter
    const templates = await templateService.listTemplatesService(context, { activeOnly });

    return {
      templates,
      count: templates.length,
    };
  }
);
