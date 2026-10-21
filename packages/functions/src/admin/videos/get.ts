import type { AdminVideoResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  getAdminVideo,
} from '@ffp/core/server';

/** GET /admin/videos/:publicId — one video in any status, with its tags. Requires system_admin. */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can view video details',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<AdminVideoResponse> => {
      const publicId = event.pathParameters?.publicId;

      if (!publicId) {
        throw new ValidationError('Video ID is required in path');
      }

      const video = await getAdminVideo(context, publicId);

      return { video };
    }
  )
);
