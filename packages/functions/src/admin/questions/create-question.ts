import { type AdminQuestionResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  questionService,
  ForbiddenError,
  isUserActor,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/** POST /admin/questions — create a question (slug must be unique). Requires system_admin. */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<AdminQuestionResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage questions');
    }

    const body = parseJsonBody(event.body);
    const question = await questionService.createQuestionService(context, body);

    return { question };
  }
);
