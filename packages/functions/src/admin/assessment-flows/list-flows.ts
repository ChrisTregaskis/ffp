import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  flowService,
  type AssessmentFlow,
} from '@ffp/core/server';

interface ListFlowsResponse {
  flows: AssessmentFlow[];
  count: number;
}

/**
 * Lambda handler for GET /admin/assessment-flows
 *
 * Protected endpoint that requires JWT authentication.
 * Returns all assessment flows. Any authenticated user can view flows.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ListFlowsResponse> => {
    // Extract user context from JWT (validates authentication)
    const context = extractUserContext(event);

    // Parse query parameters
    const activeOnly = event.queryStringParameters?.activeOnly === 'true';

    const flows = await flowService.listFlowsService(context, { activeOnly });

    return {
      flows,
      count: flows.length,
    };
  }
);
