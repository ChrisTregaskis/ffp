import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  questionService,
  ForbiddenError,
  isUserActor,
  type Question,
} from '@ffp/core/server';

interface ListQuestionsResponse {
  questions: Question[];
  count: number;
}

/** GET /admin/questions — list question bank entries. Requires the system_admin role. */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ListQuestionsResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can list questions');
    }

    const activeOnly = event.queryStringParameters?.activeOnly === 'true';

    const questions = await questionService.listQuestionsService(context, { activeOnly });

    return {
      questions,
      count: questions.length,
    };
  }
);
