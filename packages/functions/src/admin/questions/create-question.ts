import { type AdminQuestionResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  questionService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/** POST /admin/questions — create a question (slug must be unique). Requires system_admin. */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage questions',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<AdminQuestionResponse> => {
      const body = parseJsonBody(event.body);
      const question = await questionService.createQuestionService(context, body);

      return { question };
    }
  )
);
