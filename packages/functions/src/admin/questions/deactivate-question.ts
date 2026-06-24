import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  questionService,
  ValidationError,
  ForbiddenError,
  isUserActor,
} from '@ffp/core/server';

interface DeactivateQuestionResponse {
  success: boolean;
}

/**
 * DELETE /admin/questions/:publicId — soft-delete a question (isActive=false). Requires system_admin.
 * No hard-delete: questions may be referenced by scoring config and templates.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<DeactivateQuestionResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage questions');
    }

    const publicId = event.pathParameters?.publicId;

    if (!publicId) {
      throw new ValidationError('Question ID is required in path');
    }

    await questionService.deactivateQuestionService(context, publicId);

    return { success: true };
  }
);
