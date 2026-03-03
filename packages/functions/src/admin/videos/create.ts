import { type CreateVideoInput } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  ValidationError,
  isUserActor,
  createVideo,
} from '@ffp/core/server';
import type { VideoRecord } from '@ffp/database/schema';

interface CreateVideoResponse {
  video: VideoRecord;
}

/**
 * Lambda handler for POST /admin/videos
 *
 * Creates a new video record in the database with metadata and S3 key.
 * Validates input against createVideoSchema. Status defaults to 'draft'.
 * Admin role required.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<CreateVideoResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can create videos');
    }

    if (!event.body) {
      throw new ValidationError('Request body is required');
    }

    let input: CreateVideoInput;

    try {
      input = JSON.parse(event.body) as CreateVideoInput;
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    const video = await createVideo(context, input);

    return { video };
  }
);
