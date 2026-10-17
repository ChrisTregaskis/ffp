import type { AdminAssessmentTemplateDetail } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  templateService,
  ValidationError,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/assessment-templates/:publicId
 *
 * Returns a single assessment template with its questions as stored and the
 * flows that use it. Requires the system_admin role, matching every other verb
 * on this resource. The member read of the same template is
 * `GET /assessments/templates/:id`, keyed by the UUID a flow step carries.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can view assessment template details',
    async (
      event: APIGatewayProxyEventV2WithJWT,
      context
    ): Promise<AdminAssessmentTemplateDetail> => {
      const templatePublicId = event.pathParameters?.publicId;

      if (!templatePublicId) {
        throw new ValidationError('Template ID is required in path');
      }

      return await templateService.getAdminTemplateService(context, templatePublicId);
    }
  )
);
