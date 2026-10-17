import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  templateService,
  ValidationError,
  type AssessmentTemplate,
  type CreateTemplateInput,
} from '@ffp/core/server';

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
      // Parse request body
      if (!event.body) {
        throw new ValidationError('Request body is required');
      }

      let input: CreateTemplateInput;

      try {
        input = JSON.parse(event.body) as CreateTemplateInput;
      } catch {
        throw new ValidationError('Invalid JSON in request body');
      }

      // Create template via service (handles Zod validation and sets createdBy)
      const template = await templateService.createTemplateService(context, input);

      return { template };
    }
  )
);
