import type { ExerciseResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
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
  withSystemAdmin(
    'Only system administrators can view session exercises',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<ListExercisesResponse> => {
      const sessionId = event.pathParameters?.id;

      if (!sessionId) {
        throw new ValidationError('Session ID is required');
      }

      const exercises = await sessionExerciseService.listExercises(sessionId);

      return { exercises };
    }
  )
);
