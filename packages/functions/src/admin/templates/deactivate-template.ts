import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  templateService,
  ValidationError,
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
  withSystemAdmin(
    'Only system administrators can manage templates',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<DeactivateTemplateResponse> => {
      // Extract template publicId from path parameters
      const templatePublicId = event.pathParameters?.publicId;

      if (!templatePublicId) {
        throw new ValidationError('Template ID is required in path');
      }

      // Deactivate template via service (soft delete)
      await templateService.deactivateTemplateService(context, templatePublicId);

      return { success: true };
    }
  )
);
