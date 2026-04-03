import { type ProgressSummaryResponse, progressSummaryResponseSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  programmeService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /programmes/active/progress
 *
 * Returns aggregate progress statistics for the user's active programme:
 * phase/session/exercise counts and overall/current-phase percentages.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ProgressSummaryResponse> => {
    const context = extractUserContext(event);

    const progress = await programmeService.getProgressSummary(context);

    return progressSummaryResponseSchema.parse(progress);
  }
);
