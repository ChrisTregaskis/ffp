import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  flowService,
  ValidationError,
  ForbiddenError,
  isUserActor,
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
  async (event: APIGatewayProxyEventV2WithJWT): Promise<CreateFlowResponse> => {
    // Extract user context from JWT (validates authentication)
    const context = extractUserContext(event);

    // Validate system_admin role
    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage assessment flows');
    }

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
);
