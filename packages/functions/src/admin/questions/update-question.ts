import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  questionService,
  ValidationError,
  ForbiddenError,
  isUserActor,
  type Question,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface UpdateQuestionResponse {
  question: Question;
}

/** PUT /admin/questions/:publicId — update a question (slug is immutable). Requires system_admin. */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<UpdateQuestionResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage questions');
    }

    const publicId = event.pathParameters?.publicId;

    if (!publicId) {
      throw new ValidationError('Question ID is required in path');
    }

    const body = parseJsonBody(event.body);
    const question = await questionService.updateQuestionService(context, publicId, body);

    return { question };
  }
);
