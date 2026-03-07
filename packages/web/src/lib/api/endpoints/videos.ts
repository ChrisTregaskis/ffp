import {
  signedVideoUrlResponseSchema,
  videoDetailResponseSchema,
  videoListApiResponseSchema,
  type SignedVideoUrlResponse,
  type VideoDetailResponse,
  type VideoFilterInput,
  type VideoListApiResponse,
  type VideoListResponse,
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
  /**
   * Array filters (bodyParts, equipment, tags) are serialised as
   * comma-separated query strings to match the Lambda handler's
   * `parseArrayParam` convention.
   */
  list: async (filters?: VideoFilterInput, signal?: AbortSignal): Promise<VideoListApiResponse> => {
    const params: Record<string, string | undefined> = {};

    if (filters) {
      if (filters.bodyParts?.length) {
        params.body_parts = filters.bodyParts.join(',');
      }

      if (filters.equipment?.length) {
        params.equipment = filters.equipment.join(',');
      }

      if (filters.difficulty) {
        params.difficulty = filters.difficulty;
      }

      if (filters.movementType) {
        params.movement_type = filters.movementType;
      }

      if (filters.tags?.length) {
        params.tags = filters.tags.join(',');
      }
    }

    const response = await ffpClient.get(basePath, { params, signal });

    return parseApiResponse(videoListApiResponseSchema, response, {
      method: 'GET',
      path: basePath,
    });
  },

  /** Get a single video by ID (detail view) */
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

// Re-export types for consumers
export type {
  SignedVideoUrlResponse,
  VideoDetailResponse,
  VideoFilterInput,
  VideoListApiResponse,
  VideoListResponse,
};
