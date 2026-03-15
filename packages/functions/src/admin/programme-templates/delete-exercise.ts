import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  ValidationError,
  isUserActor,
  sessionExerciseService,
} from '@ffp/core/server';

/**
 * Lambda handler for DELETE /admin/exercises/{id}
 *
 * Deletes a session exercise and re-numbers remaining exercises
 * to maintain a contiguous 0-based orderIndex sequence.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<null> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can delete session exercises');
    }

    const exerciseId = event.pathParameters?.id;

    if (!exerciseId) {
      throw new ValidationError('Exercise ID is required');
    }

    await sessionExerciseService.deleteExercise(exerciseId);

    return null;
  }
);
