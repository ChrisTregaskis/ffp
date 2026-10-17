import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  flowService,
  ValidationError,
  type AssessmentFlow,
  type CreateFlowInput,
} from '@ffp/core/server';

interface CreateFlowResponse {
  flow: AssessmentFlow;
}

/**
 * Lambda handler for POST /admin/assessment-flows
 *
 * Protected endpoint that requires JWT authentication AND system_admin role.
 * Creates a new assessment flow (metadata only — steps are authored separately).
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage assessment flows',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<CreateFlowResponse> => {
      // Parse request body
      if (!event.body) {
        throw new ValidationError('Request body is required');
      }

      let input: CreateFlowInput;

      try {
        input = JSON.parse(event.body) as CreateFlowInput;
      } catch {
        throw new ValidationError('Invalid JSON in request body');
      }

      // Create flow via service (handles Zod validation)
      const flow = await flowService.createFlowService(context, input);

      return { flow };
    }
  )
);
