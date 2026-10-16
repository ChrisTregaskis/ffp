import { type SafetyGate } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  assessmentService,
  ValidationError,
} from '@ffp/core/server';

/**
 * Lambda handler for POST /assessments/:id/safety-acknowledgement
 * Records the member's confirmation that they have acted on the safety advice
 * their answers raised, releasing their result.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<SafetyGate> => {
    // Extract user context from JWT (throws UnauthorisedError if missing)
    const context = extractUserContext(event);

    const assessmentId = event.pathParameters?.id;

    if (!assessmentId) {
      throw new ValidationError('Assessment ID is required in path');
    }

    return await assessmentService.acknowledgeSafetyAdvice(assessmentId, context);
  }
);
