import { type UserAssessmentStatusResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  assessmentService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /assessments/user-status
 *
 * Returns the user's programme status and default assessment flow ID.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<UserAssessmentStatusResponse> => {
    const context = extractUserContext(event);
    return assessmentService.getUserAssessmentStatus(context);
  }
);
