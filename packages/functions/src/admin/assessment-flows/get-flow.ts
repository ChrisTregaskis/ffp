import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  flowService,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  isUserActor,
  type AssessmentFlowWithSteps,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/assessment-flows/:publicId
 *
 * Returns a single assessment flow with its steps and read-only scoring
 * configuration. Requires the system_admin role, matching every other verb on
 * this resource.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<AssessmentFlowWithSteps> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can view assessment flow details');
    }

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
