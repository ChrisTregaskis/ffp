import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  flowService,
  ValidationError,
  ForbiddenError,
  isUserActor,
  type AssessmentFlow,
  type UpdateFlowInput,
} from '@ffp/core/server';

interface UpdateFlowResponse {
  flow: AssessmentFlow;
}

/**
 * Lambda handler for PUT /admin/assessment-flows/:publicId
 *
 * Protected endpoint that requires JWT authentication AND system_admin role.
 * Updates an existing assessment flow's metadata.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<UpdateFlowResponse> => {
    // Extract user context from JWT (validates authentication)
    const context = extractUserContext(event);

    // Validate system_admin role (CRITICAL)
    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage assessment flows');
    }

    // Extract flow publicId from path parameters
    const publicId = event.pathParameters?.publicId;

    if (!publicId) {
      throw new ValidationError('Flow ID is required in path');
    }

    // Parse request body
    if (!event.body) {
      throw new ValidationError('Request body is required');
    }

    let input: UpdateFlowInput;

    try {
      input = JSON.parse(event.body) as UpdateFlowInput;
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    // Update flow via service (handles Zod validation)
    const flow = await flowService.updateFlowService(context, publicId, input);

    return { flow };
  }
);
