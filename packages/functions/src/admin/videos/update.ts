import type { AdminVideoResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  ValidationError,
  updateVideo,
} from '@ffp/core/server';

import { parseJsonBody } from '../../lib/request-body';

/**
 * Lambda handler for PUT /admin/videos/{publicId}
 *
 * Updates video metadata, status and tags. Supports partial updates.
 * Status transitions are validated: draft→active, active→archived, archived→active.
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can update videos',
    async (event: APIGatewayProxyEventV2WithJWT, context): Promise<AdminVideoResponse> => {
      const publicId = event.pathParameters?.publicId;

      if (!publicId) {
        throw new ValidationError('Video ID is required');
      }

      const body = parseJsonBody(event.body);
      const video = await updateVideo(context, publicId, body);

      return { video };
    }
  )
);
