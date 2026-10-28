import { submitAssessmentRequestSchema, type SubmitAssessmentResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  assertUuidOrNotFound,
  assessmentService,
  ValidationError,
} from '@ffp/core/server';

import { parseJsonBody } from '../lib/request-body';

/**
 * Lambda handler for POST /assessments/:id/submit
 *
 * Protected endpoint that requires JWT authentication.
 * Submits a completed assessment for scoring, transitioning status
 * to 'submitted' and enqueuing a scoring job.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<SubmitAssessmentResponse> => {
    // Extract user context from JWT (throws UnauthorisedError if missing)
    const context = extractUserContext(event);

    // Extract assessmentId from path parameters
    const assessmentId = event.pathParameters?.id;

    if (!assessmentId) {
      throw new ValidationError('Assessment ID is required in path');
    }

    assertUuidOrNotFound(assessmentId, 'Assessment');

    // Parse and validate request body
    const body = parseJsonBody(event.body);
    const input = submitAssessmentRequestSchema.parse(body);

    // Submit assessment via service
    const result = await assessmentService.submitAssessment(assessmentId, input, context);

    return result;
  }
);
