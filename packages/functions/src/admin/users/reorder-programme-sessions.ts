import type { MemberSessionOrderResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  reorderMemberSessionsService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/**
 * Lambda handler for PUT /admin/users/{id}/programme/phases/{phaseId}/sessions/reorder
 *
 * Reorders a phase's sessions; only those the member has not started may move.
 * Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can change member programmes',
    async (
      event: APIGatewayProxyEventV2WithJWT,
      context
    ): Promise<{ sessions: MemberSessionOrderResponse[] }> => {
      const publicId = event.pathParameters?.id;
      const phaseId = event.pathParameters?.phaseId;

      if (!publicId || !phaseId) {
        throw new ValidationError('User ID and phase ID are required');
      }

      const sessions = await reorderMemberSessionsService(
        context,
        publicId,
        phaseId,
        parseJsonBody(event.body)
      );

      return { sessions };
    }
  )
);
