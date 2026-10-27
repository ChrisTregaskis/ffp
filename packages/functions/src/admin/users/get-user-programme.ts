import { type ProgrammeDetailResponse, programmeDetailResponseSchema } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  getUserProgrammeService,
} from '@ffp/core/server';

/**
 * Lambda handler for GET /admin/users/{id}/programme
 *
 * Returns a member's current programme in the shape the member sees it. Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can view member programmes',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<ProgrammeDetailResponse> => {
      const publicId = event.pathParameters?.id;

      if (!publicId) {
        throw new ValidationError('User ID is required');
      }

      const detail = await getUserProgrammeService(context, publicId);

      return programmeDetailResponseSchema.parse(detail);
    }
  )
);
