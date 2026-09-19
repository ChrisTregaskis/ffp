import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  templateService,
  ValidationError,
  ForbiddenError,
  isUserActor,
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
  async (event: APIGatewayProxyEventV2WithJWT): Promise<AssignQuestionsResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage template questions');
    }

    const templatePublicId = event.pathParameters?.templatePublicId;

    if (!templatePublicId) {
      throw new ValidationError('Template ID is required in path');
    }

    const body = parseJsonBody(event.body);

    const templateQuestions = await templateService.assignQuestionsService(
      context,
      templatePublicId,
      body
    );

    return { templateQuestions };
  }
);
