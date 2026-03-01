import { videoFilterSchema, type VideoListResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  listVideos,
  listVideosByFilter,
} from '@ffp/core/server';

import { parseArrayParam } from '../lib/query-params';

/** Response type for the video list endpoint */
interface ListVideosResponse {
  videos: VideoListResponse[];
  count: number;
}

// GET /videos
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<ListVideosResponse> => {
    const context = extractUserContext(event);
    const params = event.queryStringParameters;

    const rawFilters = {
      bodyParts: parseArrayParam(params?.body_parts),
      equipment: parseArrayParam(params?.equipment),
      difficulty: params?.difficulty ?? undefined,
      movementType: params?.movement_type ?? undefined,
      tags: parseArrayParam(params?.tags),
    };

    const hasFilters = Object.values(rawFilters).some((v) => v !== undefined);

    let videos: VideoListResponse[];

    if (hasFilters) {
      const filters = videoFilterSchema.parse(rawFilters);

      videos = await listVideosByFilter(context, filters);
    } else {
      videos = await listVideos(context);
    }

    return {
      videos,
      count: videos.length,
    };
  }
);
