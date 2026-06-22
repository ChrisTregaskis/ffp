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

interface UpdateStepResponse {
  step: AdminFlowStep;
}

/**
 * Lambda handler for PUT /admin/assessment-flows/{flowPublicId}/steps/{stepPublicId}
 *
 * Protected endpoint that requires JWT authentication AND system_admin role.
 * Updates a step's type, template link and/or config. Branching is preserved
 * untouched — it is never authored through this surface.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<UpdateStepResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can manage flow steps');
    }

    const flowPublicId = event.pathParameters?.flowPublicId;
    const stepPublicId = event.pathParameters?.stepPublicId;

    if (!flowPublicId) {
      throw new ValidationError('Flow ID is required in path');
    }

    if (!stepPublicId) {
      throw new ValidationError('Step ID is required in path');
    }

    const body = parseJsonBody(event.body);
    const step = await flowStepService.updateStepService(context, flowPublicId, stepPublicId, body);

    return { step };
  }
);
