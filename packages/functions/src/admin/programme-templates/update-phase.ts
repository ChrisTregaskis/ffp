import type { PhaseResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  templatePhaseService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface UpdatePhaseResponse {
  phase: PhaseResponse;
}

/**
 * Lambda handler for PUT /admin/phases/{id}
 *
 * Updates a template phase. Supports partial updates (name, description).
 * Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can update template phases',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<UpdatePhaseResponse> => {
      const phaseId = event.pathParameters?.id;

      if (!phaseId) {
        throw new ValidationError('Phase ID is required');
      }

      const body = parseJsonBody(event.body);
      const phase = await templatePhaseService.updatePhase(phaseId, body);

      return { phase };
    }
  )
);
