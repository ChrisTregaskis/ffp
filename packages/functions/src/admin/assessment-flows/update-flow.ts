import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  flowService,
  ValidationError,
  type AssessmentFlow,
  type UpdateFlowInput,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface UpdateFlowResponse {
  flow: AssessmentFlow;
}

/**
 * Lambda handler for PUT /admin/assessment-flows/:publicId
 *
 * Protected endpoint that requires JWT authentication AND system_admin role.
 * Updates an existing assessment flow's metadata.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage assessment flows',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<UpdateFlowResponse> => {
      // Extract flow publicId from path parameters
      const publicId = event.pathParameters?.publicId;

      if (!publicId) {
        throw new ValidationError('Flow ID is required in path');
      }

      const input = parseJsonBody(event.body) as UpdateFlowInput;

      // Update flow via service (handles Zod validation)
      const flow = await flowService.updateFlowService(context, publicId, input);

      return { flow };
    }
  )
);
