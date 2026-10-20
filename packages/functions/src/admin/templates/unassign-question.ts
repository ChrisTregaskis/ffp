import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  templateQuestionService,
  ValidationError,
} from '@ffp/core/server';

interface UnassignQuestionResponse {
  success: boolean;
}

/**
 * Lambda handler for
 * DELETE /admin/assessment-templates/{templatePublicId}/questions/{questionPublicId}
 *
 * Protected endpoint that requires JWT authentication AND system_admin role.
 * Removes the assignment only — the question stays in the bank — and closes up
 * the remaining display orders.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage template questions',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<UnassignQuestionResponse> => {
      const templatePublicId = event.pathParameters?.templatePublicId;
      const questionPublicId = event.pathParameters?.questionPublicId;

      if (!templatePublicId) {
        throw new ValidationError('Template ID is required in path');
      }

      if (!questionPublicId) {
        throw new ValidationError('Question ID is required in path');
      }

      await templateQuestionService.unassignQuestionService(
        context,
        templatePublicId,
        questionPublicId
      );

      return { success: true };
    }
  )
);
