import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  flowService,
  ValidationError,
  NotFoundError,
  type AssessmentFlowWithSteps,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/assessment-flows/:publicId
 *
 * Protected endpoint that requires JWT authentication.
 * Returns a single assessment flow with its steps and read-only scoring
 * configuration. Any authenticated user can view flows.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<AssessmentFlowWithSteps> => {
    // Extract user context from JWT (validates authentication)
    const context = extractUserContext(event);

    // Extract flow publicId from path parameters
    const publicId = event.pathParameters?.publicId;

    if (!publicId) {
      throw new ValidationError('Flow ID is required in path');
    }

    const flow = await flowService.getFlowWithStepsService(context, publicId);

    if (!flow) {
      throw new NotFoundError('Assessment flow', publicId);
    }

    return flow;
  }
);
