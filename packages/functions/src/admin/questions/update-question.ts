import { type AdminQuestionResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  questionService,
  ValidationError,
  ForbiddenError,
  isUserActor,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/**
 * PUT /admin/questions/:publicId — partial update, `slug` immutable. Requires
 * system_admin. `updateQuestionService` owns the clearable-field, merged-
 * validation and type-change clean-up contract.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<AdminQuestionResponse> => {
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
