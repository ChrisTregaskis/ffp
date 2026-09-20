import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  templateService,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  isUserActor,
  type AssessmentTemplateWithQuestions,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/assessment-templates/:id
 *
 * Returns a single assessment template with its questions. Requires the
 * system_admin role, matching every other verb on this resource.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<AssessmentTemplateWithQuestions> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can view assessment template details');
    }

    const templateId = event.pathParameters?.id;

    if (!templateId) {
      throw new ValidationError('Template ID is required in path');
    }

    // Service functions consistently take ctx as first parameter
    const template = await templateService.getTemplateService(context, templateId);

    if (!template) {
      throw new NotFoundError('Assessment template', templateId);
    }

    return template;
  }
);
