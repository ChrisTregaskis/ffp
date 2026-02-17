import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  templateService,
  ValidationError,
  NotFoundError,
  type AssessmentTemplateWithQuestions,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /assessments/templates/:id
 *
 * Protected endpoint that requires JWT authentication.
 * Returns a single assessment template with its questions
 * for the assessment flow (programme users answering questions).
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<AssessmentTemplateWithQuestions> => {
    const context = extractUserContext(event);

    const templateId = event.pathParameters?.id;

    if (!templateId) {
      throw new ValidationError('Template ID is required in path');
    }

    const template = await templateService.getTemplateService(context, templateId);

    if (!template) {
      throw new NotFoundError('Assessment template', templateId);
    }

    return template;
  }
);
