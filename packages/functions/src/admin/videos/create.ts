import type { AdminVideoResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  createVideo,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/**
 * Lambda handler for POST /admin/videos
 *
 * Creates a new video record in the database with metadata, S3 key and tags.
 * Validates input against createVideoSchema (in service layer). Status defaults to 'draft'.
 * Admin role required.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can create videos',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<AdminVideoResponse> => {
      const body = parseJsonBody(event.body);
      const video = await createVideo(context, body);

      return { video };
    }
  )
);
