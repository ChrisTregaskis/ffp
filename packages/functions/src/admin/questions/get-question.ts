import { type AdminQuestionResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  questionService,
  ValidationError,
  NotFoundError,
} from '@ffp/core/server';

/**
 * GET /admin/questions/:publicId — one question with where it is used and its
 * linked video. Requires the system_admin role.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can view question details',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<AdminQuestionResponse> => {
      const publicId = event.pathParameters?.publicId;

      if (!publicId) {
        throw new ValidationError('Question ID is required in path');
      }

      const question = await questionService.getQuestionService(context, publicId);

      if (!question) {
        throw new NotFoundError('Question', publicId);
      }

      return { question };
    }
  )
);
