import type { TemplateDetailResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  programmeTemplateService,
} from '@ffp/core/server';

interface GetTemplateResponse {
  template: TemplateDetailResponse;
}

/**
 * Lambda handler for GET /admin/programme-templates/{id}
 *
 * Returns a single programme template with its full nested hierarchy
 * (phases → sessions → exercises). Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can view programme templates',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<GetTemplateResponse> => {
      const templateId = event.pathParameters?.id;

      if (!templateId) {
        throw new ValidationError('Template ID is required');
      }

      const template = await programmeTemplateService.getTemplate(templateId);

      return { template };
    }
  )
);
