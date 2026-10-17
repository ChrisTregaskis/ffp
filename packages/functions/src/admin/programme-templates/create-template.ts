import type { TemplateDetailResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  programmeTemplateService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

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
  withSystemAdmin(
    'Only system administrators can create programme templates',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<CreateTemplateResponse> => {
      const body = parseJsonBody(event.body);
      const template = await programmeTemplateService.createTemplate(body);

      return { template };
    }
  )
);
