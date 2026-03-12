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

interface UpdateTemplateResponse {
  template: TemplateDetailResponse;
}

/**
 * Lambda handler for PUT /admin/programme-templates/{id}
 *
 * Updates programme template metadata. Supports partial updates.
 * Re-validates slug uniqueness if slug is changed.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<UpdateTemplateResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can update programme templates');
    }

    const templateId = event.pathParameters?.id;

    if (!templateId) {
      throw new ValidationError('Template ID is required');
    }

    if (!event.body) {
      throw new ValidationError('Request body is required');
    }

    let body: unknown;

    try {
      body = JSON.parse(event.body);
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    const template = await programmeTemplateService.updateTemplate(templateId, body);

    return { template };
  }
);
