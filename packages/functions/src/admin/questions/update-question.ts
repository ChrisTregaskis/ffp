import { type AdminQuestionResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  questionService,
  ValidationError,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/**
 * PUT /admin/questions/:publicId — partial update, `slug` immutable. Requires
 * system_admin. `updateQuestionService` owns the clearable-field, merged-
 * validation and type-change clean-up contract.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage questions',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<AdminQuestionResponse> => {
      const publicId = event.pathParameters?.publicId;

      if (!publicId) {
        throw new ValidationError('Question ID is required in path');
      }

      const body = parseJsonBody(event.body);
      const question = await questionService.updateQuestionService(context, publicId, body);

      return { question };
    }
  )
);
