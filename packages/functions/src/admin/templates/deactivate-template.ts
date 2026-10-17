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
 * Lambda handler for DELETE /admin/assessment-templates/:publicId
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

    // Extract template publicId from path parameters
    const templatePublicId = event.pathParameters?.publicId;

    if (!templatePublicId) {
      throw new ValidationError('Template ID is required in path');
    }

    // Deactivate template via service (soft delete)
    await templateService.deactivateTemplateService(context, templatePublicId);

    return { success: true };
  }
);
