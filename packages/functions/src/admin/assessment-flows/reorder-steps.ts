import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  flowStepService,
  ValidationError,
  ForbiddenError,
  isUserActor,
  type AdminFlowStep,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface ReorderStepsResponse {
  steps: AdminFlowStep[];
}

/**
 * Lambda handler for PUT /admin/assessment-flows/{flowPublicId}/steps/reorder
 *
 * Protected endpoint that requires JWT authentication AND system_admin role.
 * Reorders the flow's active steps. Refuses on branching flows — reordering is
 * only available for linear sequences.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ReorderStepsResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage flow steps');
    }

    const flowPublicId = event.pathParameters?.flowPublicId;

    if (!flowPublicId) {
      throw new ValidationError('Flow ID is required in path');
    }

    const body = parseJsonBody(event.body);
    const steps = await flowStepService.reorderStepsService(context, flowPublicId, body);

    return { steps };
  }
);
