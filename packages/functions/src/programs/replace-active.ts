import {
  type ReplaceProgrammeResponse,
  replaceProgrammeRequestSchema,
  replaceProgrammeResponseSchema,
} from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  programmeService,
  ValidationError,
} from '@ffp/core/server';

/**
 * Lambda handler for PUT /programmes/active/replace
 *
 * Archives the user's current active programme and creates a new one
 * based on the recommendation from their latest reassessment.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ReplaceProgrammeResponse> => {
    const context = extractUserContext(event);

    const body = JSON.parse(event.body ?? '{}') as unknown;
    const input = replaceProgrammeRequestSchema.safeParse(body);

    if (!input.success) {
      throw new ValidationError(input.error.message);
    }

    const result = await programmeService.replaceProgramme(input.data, context);

    return replaceProgrammeResponseSchema.parse(result);
  }
);
