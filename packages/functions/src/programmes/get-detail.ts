import { type ProgrammeDetailResponse, programmeDetailResponseSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  programmeService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /programmes/active/detail
 *
 * Returns the active programme with full hierarchy and tiered phase visibility:
 * - Current/completed phases: full exercise detail + user session data
 * - Future phases: session summaries only (name, exercise count)
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ProgrammeDetailResponse> => {
    const context = extractUserContext(event);

    const detail = await programmeService.getProgrammeDetail(context);

    return programmeDetailResponseSchema.parse(detail);
  }
);
