import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  templateService,
  ValidationError,
  NotFoundError,
  type AssessmentTemplateWithQuestions,
} from '@ffp/core/server';
import { getDb } from '@ffp/database';

/**
 * Lambda handler for GET /admin/assessment-templates/:id
 *
 * Protected endpoint that requires JWT authentication.
 * Returns a single assessment template with its questions.
 * Any authenticated user can view templates.
 *
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<AssessmentTemplateWithQuestions> => {
    // Extract user context from JWT (validates authentication)
    extractUserContext(event);

    // Extract templateId from path parameters
    const templateId = event.pathParameters?.id;

    if (!templateId) {
      throw new ValidationError('Template ID is required in path');
    }

    const db = getDb();
    const template = await templateService.getTemplateService(db, templateId);

    if (!template) {
      throw new NotFoundError('Assessment template', templateId);
    }

    return template;
  }
);
