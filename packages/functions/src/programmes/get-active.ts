import { type ActiveProgrammeResponse, activeProgrammeResponseSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  programmeService,
  NotFoundError,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /programmes/active
 * Returns the current user's active programme.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ActiveProgrammeResponse> => {
    const context = extractUserContext(event);

    const programme = await programmeService.getActiveProgramme(context);

    if (!programme) {
      throw new NotFoundError('Active programme');
    }

    return activeProgrammeResponseSchema.parse(programme);
  }
);
