import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  flowStepService,
  ValidationError,
} from '@ffp/core/server';

interface DeleteStepResponse {
  success: boolean;
}

/**
 * Lambda handler for DELETE /admin/assessment-flows/{flowPublicId}/steps/{stepPublicId}
 *
 * Protected endpoint that requires JWT authentication AND system_admin role.
 * Soft-deletes a step (isActive = false). Records are kept so historic
 * assessments that reference the step ID stay intact; order gaps are harmless.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage flow steps',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<DeleteStepResponse> => {
      const flowPublicId = event.pathParameters?.flowPublicId;
      const stepPublicId = event.pathParameters?.stepPublicId;

      if (!flowPublicId) {
        throw new ValidationError('Flow ID is required in path');
      }

      if (!stepPublicId) {
        throw new ValidationError('Step ID is required in path');
      }

      await flowStepService.deleteStepService(context, flowPublicId, stepPublicId);

      return { success: true };
    }
  )
);
