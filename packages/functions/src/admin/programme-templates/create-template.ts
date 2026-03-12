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

interface CreateTemplateResponse {
  template: TemplateDetailResponse;
}

/**
 * Lambda handler for POST /admin/programme-templates
 *
 * Creates a new programme template. Validates input and enforces slug uniqueness.
 * Returns 201 Created with the new template (including empty phases array).
 * Admin role required.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<CreateTemplateResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can create programme templates');
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

    const template = await programmeTemplateService.createTemplate(body);

    return { template };
  }
);
