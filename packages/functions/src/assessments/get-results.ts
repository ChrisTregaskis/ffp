import { type AssessmentResultsResponse, assessmentResultsResponseSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  assertUuidOrNotFound,
  assessmentService,
  ValidationError,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /assessments/:id/results
 * Returns assessment results for polling after submission.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<AssessmentResultsResponse> => {
    // Extract user context from JWT (throws UnauthorisedError if missing)
    const context = extractUserContext(event);

    // Extract assessmentId from path parameters
    const assessmentId = event.pathParameters?.id;

    if (!assessmentId) {
      throw new ValidationError('Assessment ID is required in path');
    }

    assertUuidOrNotFound(assessmentId, 'Assessment');

    // Get assessment results via service
    const result = await assessmentService.getAssessmentResults(assessmentId, context);

    // The stored scores carry scoring internals a member is not shown; the schema drops them
    return assessmentResultsResponseSchema.parse(result);
  }
);
