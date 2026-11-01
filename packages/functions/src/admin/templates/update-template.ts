import type { UpdateAssessmentTemplateInput } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  templateService,
  ValidationError,
  type AssessmentTemplate,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface UpdateTemplateResponse {
  template: AssessmentTemplate;
}

/**
 * Lambda handler for PUT /admin/assessment-templates/:publicId
 *
 * Updates an existing assessment template.
 *
 * Version is auto-incremented by the repository on update.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage templates',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<UpdateTemplateResponse> => {
      // Extract template publicId from path parameters
      const templatePublicId = event.pathParameters?.publicId;

      if (!templatePublicId) {
        throw new ValidationError('Template ID is required in path');
      }

      const input = parseJsonBody(event.body) as UpdateAssessmentTemplateInput;

      // Update template via service (handles Zod validation, version auto-increments)
      const template = await templateService.updateTemplateService(
        context,
        templatePublicId,
        input
      );

      return { template };
    }
  )
);
