import type { MemberExerciseResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  updateMemberExerciseService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/**
 * Lambda handler for PUT /admin/users/{id}/programme/exercises/{exerciseId}
 *
 * Changes the video or prescription of an exercise in a session the member has not started.
 * Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can change member programmes',
    async (
      event: APIGatewayProxyEventV2WithJWT,
      context
    ): Promise<{ exercise: MemberExerciseResponse }> => {
      const publicId = event.pathParameters?.id;
      const exerciseId = event.pathParameters?.exerciseId;

      if (!publicId || !exerciseId) {
        throw new ValidationError('User ID and exercise ID are required');
      }

      const exercise = await updateMemberExerciseService(
        context,
        publicId,
        exerciseId,
        parseJsonBody(event.body)
      );

      return { exercise };
    }
  )
);
