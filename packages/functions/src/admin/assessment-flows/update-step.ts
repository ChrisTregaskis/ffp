import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  flowStepService,
  ValidationError,
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
  withSystemAdmin(
    'Only system administrators can manage flow steps',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<UpdateStepResponse> => {
      const flowPublicId = event.pathParameters?.flowPublicId;
      const stepPublicId = event.pathParameters?.stepPublicId;

      if (!flowPublicId) {
        throw new ValidationError('Flow ID is required in path');
      }

      if (!stepPublicId) {
        throw new ValidationError('Step ID is required in path');
      }

      const body = parseJsonBody(event.body);
      const step = await flowStepService.updateStepService(
        context,
        flowPublicId,
        stepPublicId,
        body
      );

      return { step };
    }
  )
);
