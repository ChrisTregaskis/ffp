import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  templateService,
  ValidationError,
  ForbiddenError,
  isUserActor,
  type AssessmentTemplate,
  type CreateTemplateInput,
} from '@ffp/core/server';

interface CreateTemplateResponse {
  template: AssessmentTemplate;
}

/**
 * Lambda handler for POST /admin/assessment-templates
 *
 * Protected endpoint that requires JWT authentication AND system_admin role.
 * Creates a new assessment template.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<CreateTemplateResponse> => {
    // Extract user context from JWT (validates authentication)
    const context = extractUserContext(event);

    // Validate system_admin role
    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage templates');
    }

    // Parse request body
    if (!event.body) {
      throw new ValidationError('Request body is required');
    }

    let input: CreateTemplateInput;

    try {
      input = JSON.parse(event.body) as CreateTemplateInput;
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    // Create template via service (handles Zod validation and sets createdBy)
    const template = await templateService.createTemplateService(context, input);

    return { template };
  }
);
