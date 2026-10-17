import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  flowStepService,
  ValidationError,
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
  withSystemAdmin(
    'Only system administrators can manage flow steps',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<CreateStepResponse> => {
      const flowPublicId = event.pathParameters?.flowPublicId;

      if (!flowPublicId) {
        throw new ValidationError('Flow ID is required in path');
      }

      const body = parseJsonBody(event.body);
      const step = await flowStepService.createStepService(context, flowPublicId, body);

      return { step };
    }
  )
);
