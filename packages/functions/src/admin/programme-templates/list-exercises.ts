import type { ExerciseResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  ValidationError,
  isUserActor,
  sessionExerciseService,
} from '@ffp/core/server';

interface ListExercisesResponse {
  exercises: ExerciseResponse[];
}

/**
 * Lambda handler for GET /admin/sessions/{id}/exercises
 *
 * Returns all exercises for a template session, ordered by orderIndex.
 * Each exercise includes embedded video summary data.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ListExercisesResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can view session exercises');
    }

    const sessionId = event.pathParameters?.id;

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    const exercises = await sessionExerciseService.listExercises(sessionId);

    return { exercises };
  }
);
