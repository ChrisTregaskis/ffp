import type { TemplateDetailResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  ValidationError,
  isUserActor,
  programmeTemplateService,
} from '@ffp/core/server';

interface DeactivateTemplateResponse {
  template: TemplateDetailResponse;
}

/**
 * Lambda handler for PUT /admin/programme-templates/{id}/deactivate
 *
 * Sets isActive to false for a programme template.
 * Admin role required.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<DeactivateTemplateResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can deactivate programme templates');
    }

    const templateId = event.pathParameters?.id;

    if (!templateId) {
      throw new ValidationError('Template ID is required');
    }

    const template = await programmeTemplateService.deactivateTemplate(templateId);

    return { template };
  }
);
