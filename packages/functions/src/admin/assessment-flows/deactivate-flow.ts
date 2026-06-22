import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  flowService,
  ValidationError,
  ForbiddenError,
  isUserActor,
} from '@ffp/core/server';

interface DeactivateFlowResponse {
  success: boolean;
}

/**
 * Lambda handler for DELETE /admin/assessment-flows/:publicId
 *
 * Protected endpoint that requires JWT authentication AND system_admin role.
 * Deactivates an assessment flow (soft delete - sets isActive to false).
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<DeactivateFlowResponse> => {
    // Extract user context from JWT (validates authentication)
    const context = extractUserContext(event);

    // Validate system_admin role
    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage assessment flows');
    }

    // Extract flow publicId from path parameters
    const publicId = event.pathParameters?.publicId;

    if (!publicId) {
      throw new ValidationError('Flow ID is required in path');
    }

    // Deactivate flow via service (soft delete)
    await flowService.deactivateFlowService(context, publicId);

    return { success: true };
  }
);
