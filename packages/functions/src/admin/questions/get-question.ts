import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  questionService,
  ValidationError,
  NotFoundError,
  type Question,
} from '@ffp/core/server';

/** GET /admin/questions/:publicId — fetch one question. Open to any authenticated user. */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<Question> => {
    const context = extractUserContext(event);
    const publicId = event.pathParameters?.publicId;

    if (!publicId) {
      throw new ValidationError('Question ID is required in path');
    }

    const question = await questionService.getQuestionService(context, publicId);

    if (!question) {
      throw new NotFoundError('Question', publicId);
    }

    return question;
  }
);
