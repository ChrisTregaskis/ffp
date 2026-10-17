import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  flowService,
  ValidationError,
  NotFoundError,
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
  withSystemAdmin(
    'Only system administrators can view assessment flow details',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<AssessmentFlowWithSteps> => {
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
  )
);
