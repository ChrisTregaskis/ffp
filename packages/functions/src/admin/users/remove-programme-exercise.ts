import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  removeMemberExerciseService,
} from '@ffp/core/server';

/**
 * Lambda handler for DELETE /admin/users/{id}/programme/exercises/{exerciseId}
 *
 * Removes an exercise from a session the member has not started, keeping at least one.
 * Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can change member programmes',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<null> => {
      const publicId = event.pathParameters?.id;
      const exerciseId = event.pathParameters?.exerciseId;

      if (!publicId || !exerciseId) {
        throw new ValidationError('User ID and exercise ID are required');
      }

      await removeMemberExerciseService(context, publicId, exerciseId);

      return null;
    }
  )
);
