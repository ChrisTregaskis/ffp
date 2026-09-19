import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  templateService,
  ValidationError,
  ForbiddenError,
  isUserActor,
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
  async (event: APIGatewayProxyEventV2WithJWT): Promise<UnassignQuestionResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage template questions');
    }

    const templatePublicId = event.pathParameters?.templatePublicId;
    const questionPublicId = event.pathParameters?.questionPublicId;

    if (!templatePublicId) {
      throw new ValidationError('Template ID is required in path');
    }

    if (!questionPublicId) {
      throw new ValidationError('Question ID is required in path');
    }

    await templateService.unassignQuestionService(context, templatePublicId, questionPublicId);

    return { success: true };
  }
);
