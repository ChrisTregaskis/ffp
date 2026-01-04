import { startAssessmentRequestSchema, type StartAssessmentResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  assessmentService,
} from '@ffp/core/server';

/**
 * Lambda handler for POST /assessments/start
 *
 * Protected endpoint that requires JWT authentication.
 * Starts a new assessment or resumes an existing one for the authenticated user.
 *
 * Request body:
 * ```json
 * { "flowId": "550e8400-e29b-41d4-a716-446655440000" }
 * ```
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<StartAssessmentResponse> => {
    // Extract user context from JWT (throws UnauthorisedError if missing)
    const context = extractUserContext(event);

    // Parse and validate request body
    const body = JSON.parse(event.body ?? '{}') as unknown;
    const input = startAssessmentRequestSchema.parse(body);

    // Start or resume assessment via service
    const result = await assessmentService.startAssessment(input.flowId, context);

    return result;
  }
);
