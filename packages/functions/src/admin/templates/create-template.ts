import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  templateService,
  type AssessmentTemplate,
  type CreateTemplateInput,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface CreateTemplateResponse {
  template: AssessmentTemplate;
}

/**
 * Lambda handler for POST /admin/assessment-templates
 *
 * Protected endpoint that requires JWT authentication AND system_admin role.
 * Creates a new assessment template.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage templates',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<CreateTemplateResponse> => {
      const input = parseJsonBody(event.body) as CreateTemplateInput;

      // Create template via service (handles Zod validation and sets createdBy)
      const template = await templateService.createTemplateService(context, input);

      return { template };
    }
  )
);
