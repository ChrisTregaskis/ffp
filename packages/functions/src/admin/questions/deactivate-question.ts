import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  questionService,
  ValidationError,
} from '@ffp/core/server';

interface DeactivateQuestionResponse {
  success: boolean;
}

/**
 * DELETE /admin/questions/:publicId — soft-delete a question (isActive=false). Requires system_admin.
 * No hard-delete: questions may be referenced by scoring config and templates.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage questions',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<DeactivateQuestionResponse> => {
      const publicId = event.pathParameters?.publicId;

      if (!publicId) {
        throw new ValidationError('Question ID is required in path');
      }

      await questionService.deactivateQuestionService(context, publicId);

      return { success: true };
    }
  )
);
