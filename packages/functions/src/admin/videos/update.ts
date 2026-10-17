import type { VideoDetailResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  updateVideo,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

interface UpdateVideoResponse {
  video: VideoDetailResponse;
}

/**
 * Lambda handler for PUT /admin/videos/{id}
 *
 * Updates video metadata and/or status. Supports partial updates.
 * Status transitions are validated: draft→active, active→archived, archived→active.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can update videos',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<UpdateVideoResponse> => {
      const videoId = event.pathParameters?.id;

      if (!videoId) {
        throw new ValidationError('Video ID is required');
      }

      const body = parseJsonBody(event.body);
      const video = await updateVideo(context, videoId, body);

      return { video };
    }
  )
);
