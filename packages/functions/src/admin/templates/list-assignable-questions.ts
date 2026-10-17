import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  templateQuestionService,
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
 * assignment UI adds from. Requires the system_admin role.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can list assignable questions',
    async (
      event: APIGatewayProxyEventV2WithJWT,
      context
    ): Promise<ListAssignableQuestionsResponse> => {
      const templatePublicId = event.pathParameters?.templatePublicId;

      if (!templatePublicId) {
        throw new ValidationError('Template ID is required in path');
      }

      const questions = await templateQuestionService.listAssignableQuestionsService(
        context,
        templatePublicId
      );

      return {
        questions,
        count: questions.length,
      };
    }
  )
);
