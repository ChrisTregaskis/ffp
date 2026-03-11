import { saveProgressRequestSchema, type SaveProgressResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  assessmentService,
  ValidationError,
} from '@ffp/core/server';

/**
 * Lambda handler for PUT /assessments/:id/progress
 *
 * Protected endpoint that requires JWT authentication.
 * Saves assessment progress (answers and current step) for the authenticated user.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<SaveProgressResponse> => {
    // Extract user context from JWT (throws UnauthorisedError if missing)
    const context = extractUserContext(event);

    // Extract assessmentId from path parameters
    const assessmentId = event.pathParameters?.id;

    if (!assessmentId) {
      throw new ValidationError('Assessment ID is required in path');
    }

    // Parse and validate request body
    const body = JSON.parse(event.body ?? '{}') as unknown;
    const input = saveProgressRequestSchema.parse(body);

    // Save progress via service
    const result = await assessmentService.saveProgress(assessmentId, input, context);

    return result;
  }
);
