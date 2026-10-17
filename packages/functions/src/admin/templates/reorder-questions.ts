import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  templateQuestionService,
  ValidationError,
  type QuestionWithConfig,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface ReorderQuestionsResponse {
  templateQuestions: QuestionWithConfig[];
}

/**
 * Lambda handler for PUT /admin/assessment-templates/{templatePublicId}/questions/reorder
 *
 * Protected endpoint that requires JWT authentication AND system_admin role.
 * Rewrites the template's display order from the supplied sequence, which must
 * list every assigned question exactly once.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage template questions',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<ReorderQuestionsResponse> => {
      const templatePublicId = event.pathParameters?.templatePublicId;

      if (!templatePublicId) {
        throw new ValidationError('Template ID is required in path');
      }

      const body = parseJsonBody(event.body);

      const templateQuestions = await templateQuestionService.reorderQuestionsService(
        context,
        templatePublicId,
        body
      );

      return { templateQuestions };
    }
  )
);
