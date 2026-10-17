import type { ScoringDryRunResult } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  scoringDryRunService,
  ValidationError,
  ForbiddenError,
  isUserActor,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/**
 * Lambda handler for POST /admin/assessment-flows/{publicId}/scoring/dry-run
 *
 * Requires the system_admin role. Saves nothing.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ScoringDryRunResult> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can test assessment flow scoring');
    }

    const publicId = event.pathParameters?.publicId;

    if (!publicId) {
      throw new ValidationError('Flow ID is required in path');
    }

    const body = parseJsonBody(event.body);

    return scoringDryRunService.dryRunFlowScoringService(context, publicId, body);
  }
);
