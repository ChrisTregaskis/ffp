import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  templateQuestionService,
  ValidationError,
  ForbiddenError,
  isUserActor,
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
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ReorderQuestionsResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage template questions');
    }

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
);
