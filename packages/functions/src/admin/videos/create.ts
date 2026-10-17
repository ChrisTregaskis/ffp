import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  createVideo,
} from '@ffp/core/server';
import type { VideoRecord } from '@ffp/database/schema';

import { parseJsonBody } from '../../lib/request-body';

interface CreateVideoResponse {
  video: VideoRecord;
}

/**
 * Lambda handler for POST /admin/videos
 *
 * Creates a new video record in the database with metadata and S3 key.
 * Validates input against createVideoSchema (in service layer). Status defaults to 'draft'.
 * Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can create videos',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<CreateVideoResponse> => {
      const body = parseJsonBody(event.body);
      const video = await createVideo(context, body);

      return { video };
    }
  )
);
