import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  flowService,
  type AssessmentFlow,
  type CreateFlowInput,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface CreateFlowResponse {
  flow: AssessmentFlow;
}

/**
 * Lambda handler for POST /admin/assessment-flows
 *
 * Protected endpoint that requires JWT authentication AND system_admin role.
 * Creates a new assessment flow (metadata only — steps are authored separately).
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can manage assessment flows',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<CreateFlowResponse> => {
      const input = parseJsonBody(event.body) as CreateFlowInput;

      // Create flow via service (handles Zod validation)
      const flow = await flowService.createFlowService(context, input);

      return { flow };
    }
  )
);
