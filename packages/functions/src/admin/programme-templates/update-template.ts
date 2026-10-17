import type { TemplateDetailResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  programmeTemplateService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

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
  withSystemAdmin(
    'Only system administrators can update programme templates',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<UpdateTemplateResponse> => {
      const templateId = event.pathParameters?.id;

      if (!templateId) {
        throw new ValidationError('Template ID is required');
      }

      const body = parseJsonBody(event.body);
      const template = await programmeTemplateService.updateTemplate(templateId, body);

      return { template };
    }
  )
);
