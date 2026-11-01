import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  templateService,
  ValidationError,
  type AssessmentTemplateWithQuestions,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface DuplicateTemplateRequest {
  name: string;
}

interface DuplicateTemplateResponse {
  template: AssessmentTemplateWithQuestions;
}

/**
 * Lambda handler for POST /admin/assessment-templates/:publicId/duplicate
 *
 * Duplicates an existing assessment template with a new name.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage templates',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<DuplicateTemplateResponse> => {
      // Extract template publicId from path
      const templatePublicId = event.pathParameters?.publicId;

      if (!templatePublicId) {
        throw new ValidationError('Template ID is required in path');
      }

      const input = parseJsonBody(event.body) as DuplicateTemplateRequest;

      // Validate name is provided
      if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
        throw new ValidationError('Name is required for the duplicated template');
      }

      // Duplicate template via service (handles NotFoundError if source doesn't exist)
      const template = await templateService.duplicateTemplateService(
        context,
        templatePublicId,
        input.name.trim()
      );

      return { template };
    }
  )
);
