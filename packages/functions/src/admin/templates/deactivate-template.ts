import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  templateService,
  ValidationError,
  ForbiddenError,
  isUserActor,
} from '@ffp/core/server';

interface DeactivateTemplateResponse {
  success: boolean;
}

/**
 * Lambda handler for DELETE /admin/assessment-templates/:id
 *
 * Deactivates an assessment template (soft delete - sets isActive to false).
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<DeactivateTemplateResponse> => {
    // Extract user context from JWT (validates authentication)
    const context = extractUserContext(event);

    // Validate system_admin role
    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage templates');
    }

    // Extract templateId from path parameters
    const templateId = event.pathParameters?.id;

    if (!templateId) {
      throw new ValidationError('Template ID is required in path');
    }

    // Deactivate template via service (soft delete)
    await templateService.deactivateTemplateService(context, templateId);

    return { success: true };
  }
);
