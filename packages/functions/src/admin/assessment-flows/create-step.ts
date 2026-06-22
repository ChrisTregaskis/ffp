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

interface CreateStepResponse {
  step: AdminFlowStep;
}

/**
 * Lambda handler for POST /admin/assessment-flows/{flowPublicId}/steps
 *
 * Protected endpoint that requires JWT authentication AND system_admin role.
 * Appends a new step to the flow (the server assigns its order). Branching is
 * not authored here.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<CreateStepResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage flow steps');
    }

    const flowPublicId = event.pathParameters?.flowPublicId;

    if (!flowPublicId) {
      throw new ValidationError('Flow ID is required in path');
    }

    const body = parseJsonBody(event.body);
    const step = await flowStepService.createStepService(context, flowPublicId, body);

    return { step };
  }
);
