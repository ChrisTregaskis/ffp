import type { UpdateAssessmentTemplateInput } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  templateService,
  ValidationError,
  ForbiddenError,
  isUserActor,
  type AssessmentTemplate,
} from '@ffp/core/server';

interface UpdateTemplateResponse {
  template: AssessmentTemplate;
}

/**
 * Lambda handler for PUT /admin/assessment-templates/:id
 *
 * Updates an existing assessment template.
 *
 * Version is auto-incremented by the repository on update.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<UpdateTemplateResponse> => {
    // Extract user context from JWT (validates authentication)
    const context = extractUserContext(event);

    // Validate system_admin role (CRITICAL)
    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage templates');
    }

    // Extract templateId from path parameters
    const templateId = event.pathParameters?.id;

    if (!templateId) {
      throw new ValidationError('Template ID is required in path');
    }

    // Parse request body
    if (!event.body) {
      throw new ValidationError('Request body is required');
    }

    let input: UpdateAssessmentTemplateInput;

    try {
      input = JSON.parse(event.body) as UpdateAssessmentTemplateInput;
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    // Update template via service (handles Zod validation, version auto-increments)
    const template = await templateService.updateTemplateService(context, templateId, input);

    return { template };
  }
);
