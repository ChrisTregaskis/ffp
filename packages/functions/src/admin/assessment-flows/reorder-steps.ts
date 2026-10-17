import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  flowStepService,
  ValidationError,
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
  withSystemAdmin(
    'Only system administrators can manage flow steps',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<ReorderStepsResponse> => {
      const flowPublicId = event.pathParameters?.flowPublicId;

      if (!flowPublicId) {
        throw new ValidationError('Flow ID is required in path');
      }

      const body = parseJsonBody(event.body);
      const steps = await flowStepService.reorderStepsService(context, flowPublicId, body);

      return { steps };
    }
  )
);
