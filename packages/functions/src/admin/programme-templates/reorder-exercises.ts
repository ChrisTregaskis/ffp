import type { ExerciseResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  sessionExerciseService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface ReorderExercisesResponse {
  exercises: ExerciseResponse[];
}

/**
 * Lambda handler for PUT /admin/sessions/{id}/exercises/reorder
 *
 * Reorders exercises within a template session.
 * Accepts an array of exercise IDs in the desired order.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can reorder session exercises',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<ReorderExercisesResponse> => {
      const sessionId = event.pathParameters?.id;

      if (!sessionId) {
        throw new ValidationError('Session ID is required');
      }

      const body = parseJsonBody(event.body);
      const exercises = await sessionExerciseService.reorderExercises(sessionId, body);

      return { exercises };
    }
  )
);
