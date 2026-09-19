import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  templateService,
  ValidationError,
  type Question,
} from '@ffp/core/server';

interface ListAssignableQuestionsResponse {
  questions: Question[];
  count: number;
}

/**
 * GET /admin/assessment-templates/{templatePublicId}/assignable-questions
 *
 * Lists the active questions not yet assigned to the template — the pool the
 * assignment UI adds from. Open to any authenticated user.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ListAssignableQuestionsResponse> => {
    const context = extractUserContext(event);

    const templatePublicId = event.pathParameters?.templatePublicId;

    if (!templatePublicId) {
      throw new ValidationError('Template ID is required in path');
    }

    const questions = await templateService.listAssignableQuestionsService(
      context,
      templatePublicId
    );

    return {
      questions,
      count: questions.length,
    };
  }
);
