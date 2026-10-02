import { type AdminQuestionResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  questionService,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  isUserActor,
} from '@ffp/core/server';

/**
 * GET /admin/questions/:publicId — one question with where it is used and its
 * linked video. Requires the system_admin role.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<AdminQuestionResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can view question details');
    }

    const publicId = event.pathParameters?.publicId;

    if (!publicId) {
      throw new ValidationError('Question ID is required in path');
    }

    const question = await questionService.getQuestionService(context, publicId);

    if (!question) {
      throw new NotFoundError('Question', publicId);
    }

    return { question };
  }
);
