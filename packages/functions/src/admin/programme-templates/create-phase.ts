import type { PhaseResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  templatePhaseService,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface CreatePhaseResponse {
  phase: PhaseResponse;
}

/**
 * Lambda handler for POST /admin/programme-templates/{id}/phases
 *
 * Creates a new phase within a programme template.
 * Auto-assigns phaseNumber and updates template totalPhases.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can create template phases',
    async (event: APIGatewayProxyEventV2WithJWT): Promise<CreatePhaseResponse> => {
      const templateId = event.pathParameters?.id;

      if (!templateId) {
        throw new ValidationError('Template ID is required');
      }

      const body = parseJsonBody(event.body, { required: false });
      const phase = await templatePhaseService.createPhase(templateId, body);

      return { phase };
    }
  )
);
