import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  questionService,
  type Question,
} from '@ffp/core/server';

interface ListQuestionsResponse {
  questions: Question[];
  count: number;
}

/** GET /admin/questions — list question bank entries. Open to any authenticated user. */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ListQuestionsResponse> => {
    const context = extractUserContext(event);
    const activeOnly = event.queryStringParameters?.activeOnly === 'true';

    const questions = await questionService.listQuestionsService(context, { activeOnly });

    return {
      questions,
      count: questions.length,
    };
  }
);
