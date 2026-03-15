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

import { parseJsonBody } from '../../lib/request-body';

interface UpdateExerciseResponse {
  exercise: ExerciseResponse;
}

/**
 * Lambda handler for PUT /admin/exercises/{id}
 *
 * Updates a session exercise. Supports partial updates
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<UpdateExerciseResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can update session exercises');
    }

    const exerciseId = event.pathParameters?.id;

    if (!exerciseId) {
      throw new ValidationError('Exercise ID is required');
    }

    const body = parseJsonBody(event.body);
    const exercise = await sessionExerciseService.updateExercise(exerciseId, body);

    return { exercise };
  }
);
