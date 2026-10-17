import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  flowService,
  ValidationError,
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
  withSystemAdmin(
    'Only system administrators can manage assessment flows',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<DeactivateFlowResponse> => {
      // Extract flow publicId from path parameters
      const publicId = event.pathParameters?.publicId;

      if (!publicId) {
        throw new ValidationError('Flow ID is required in path');
      }

      // Deactivate flow via service (soft delete)
      await flowService.deactivateFlowService(context, publicId);

      return { success: true };
    }
  )
);
