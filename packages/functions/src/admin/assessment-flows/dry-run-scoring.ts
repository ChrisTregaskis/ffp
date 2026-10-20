import type { ScoringDryRunResult } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  scoringDryRunService,
  ValidationError,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/**
 * Lambda handler for POST /admin/assessment-flows/{publicId}/scoring/dry-run
 *
 * Requires the system_admin role. Saves nothing.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can test assessment flow scoring',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<ScoringDryRunResult> => {
      const publicId = event.pathParameters?.publicId;

      if (!publicId) {
        throw new ValidationError('Flow ID is required in path');
      }

      const body = parseJsonBody(event.body);

      return scoringDryRunService.dryRunFlowScoringService(context, publicId, body);
    }
  )
);
