import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  sessionExerciseService,
} from '@ffp/core/server';

/**
 * Lambda handler for DELETE /admin/exercises/{id}
 *
 * Deletes a session exercise and re-numbers remaining exercises
 * to maintain a contiguous 0-based orderIndex sequence.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can delete session exercises',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<null> => {
      const exerciseId = event.pathParameters?.id;

      if (!exerciseId) {
        throw new ValidationError('Exercise ID is required');
      }

      await sessionExerciseService.deleteExercise(exerciseId);

      return null;
    }
  )
);
