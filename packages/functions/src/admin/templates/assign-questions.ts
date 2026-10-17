import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  templateQuestionService,
  ValidationError,
  type QuestionWithConfig,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface AssignQuestionsResponse {
  templateQuestions: QuestionWithConfig[];
}

/**
 * Lambda handler for POST /admin/assessment-templates/{templatePublicId}/questions
 *
 * Protected endpoint that requires JWT authentication AND system_admin role.
 * Appends one or more active questions to the template and returns the
 * template's full question list in display order.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage template questions',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<AssignQuestionsResponse> => {
      const templatePublicId = event.pathParameters?.templatePublicId;

      if (!templatePublicId) {
        throw new ValidationError('Template ID is required in path');
      }

      const body = parseJsonBody(event.body);

      const templateQuestions = await templateQuestionService.assignQuestionsService(
        context,
        templatePublicId,
        body
      );

      return { templateQuestions };
    }
  )
);
