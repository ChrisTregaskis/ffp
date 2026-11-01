import {
  signedVideoUrlResponseSchema,
  videoDetailResponseSchema,
  type SignedVideoUrlResponse,
  type VideoDetailResponse,
} from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const basePath = '/videos';

/**
 * Videos API methods
 *
 * All responses are validated against Zod schemas from @ffp/core
 * to ensure type safety at runtime, not just compile time.
 */
export const videosApi = {
  /** Get a single active video by publicId (detail view) */
  get: async (videoId: string, signal?: AbortSignal): Promise<VideoDetailResponse> => {
    const path = `${basePath}/${videoId}`;
    const response = await ffpClient.get(path, { signal });

    return parseApiResponse(videoDetailResponseSchema, response, { method: 'GET', path });
  },

  /** Get a time-limited CloudFront signed URL for video playback */
  getSignedUrl: async (videoId: string, signal?: AbortSignal): Promise<SignedVideoUrlResponse> => {
    const path = `${basePath}/${videoId}/signed-url`;
    const response = await ffpClient.get(path, { signal });

    return parseApiResponse(signedVideoUrlResponseSchema, response, { method: 'GET', path });
  },
};
