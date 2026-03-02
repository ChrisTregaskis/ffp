import type { VideoDetailResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ValidationError,
  getVideo,
} from '@ffp/core/server';

// GET /videos/{id}
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<VideoDetailResponse> => {
    const context = extractUserContext(event);

    const videoId = event.pathParameters?.id;
    if (!videoId) {
      throw new ValidationError('Video ID is required in path');
    }

    const includeInactive = event.queryStringParameters?.include_inactive === 'true';

    return await getVideo(context, videoId, { includeInactive });
  }
);
