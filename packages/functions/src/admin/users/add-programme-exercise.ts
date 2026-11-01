import type { MemberExerciseResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  addMemberExerciseService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/**
 * Lambda handler for POST /admin/users/{id}/programme/sessions/{sessionId}/exercises
 *
 * Adds an exercise to a session the member has not started. Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can change member programmes',
    async (
      event: APIGatewayProxyEventV2WithJWT,
      context
    ): Promise<{ exercise: MemberExerciseResponse }> => {
      const publicId = event.pathParameters?.id;
      const sessionId = event.pathParameters?.sessionId;

      if (!publicId || !sessionId) {
        throw new ValidationError('User ID and session ID are required');
      }

      const exercise = await addMemberExerciseService(
        context,
        publicId,
        sessionId,
        parseJsonBody(event.body)
      );

      return { exercise };
    }
  )
);
