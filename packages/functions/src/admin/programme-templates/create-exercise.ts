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

interface CreateExerciseResponse {
  exercise: ExerciseResponse;
}

/**
 * Lambda handler for POST /admin/sessions/{id}/exercises
 *
 * Creates a new exercise within a template session.
 * Pre-populates prescription from video defaults when not explicitly provided.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<CreateExerciseResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can create session exercises');
    }

    const sessionId = event.pathParameters?.id;

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    const body = parseJsonBody(event.body);
    const exercise = await sessionExerciseService.createExercise(sessionId, body);

    return { exercise };
  }
);
