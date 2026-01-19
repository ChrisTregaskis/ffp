import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  templateService,
  ValidationError,
  ForbiddenError,
  isUserActor,
  type AssessmentTemplateWithQuestions,
} from '@ffp/core/server';

interface DuplicateTemplateRequest {
  name: string;
}

interface DuplicateTemplateResponse {
  template: AssessmentTemplateWithQuestions;
}

/**
 * Lambda handler for POST /admin/assessment-templates/:id/duplicate
 *
 * Duplicates an existing assessment template with a new name.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<DuplicateTemplateResponse> => {
    // Extract user context from JWT (validates authentication)
    const context = extractUserContext(event);

    // Validate system_admin role
    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage templates');
    }

    // Extract template ID from path
    const templateId = event.pathParameters?.id;

    if (!templateId) {
      throw new ValidationError('Template ID is required in path');
    }

    // Parse request body
    if (!event.body) {
      throw new ValidationError('Request body is required');
    }

    let input: DuplicateTemplateRequest;

    try {
      input = JSON.parse(event.body) as DuplicateTemplateRequest;
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    // Validate name is provided
    if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
      throw new ValidationError('Name is required for the duplicated template');
    }

    // Duplicate template via service (handles NotFoundError if source doesn't exist)
    const template = await templateService.duplicateTemplateService(
      context,
      templateId,
      input.name.trim()
    );

    return { template };
  }
);
