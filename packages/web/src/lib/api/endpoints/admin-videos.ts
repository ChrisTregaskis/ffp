import { z } from 'zod';

import type {
  AdminVideoFilterInput,
  CreateVideoInput,
  PaginationInput,
  UploadUrlRequest,
  UploadUrlResponse,
} from '@ffp/core';
import { paginatedAdminVideoResponseSchema, uploadUrlResponseSchema, videoSchema } from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const basePath = '/admin/videos';

/** Response schema for the create video endpoint */
const createVideoResponseSchema = z.object({
  video: videoSchema,
});

/** Paginated admin video list response type */
export type PaginatedAdminVideoResponse = z.infer<typeof paginatedAdminVideoResponseSchema>;

/**
 * Admin Video API methods
 * These endpoints require system_admin role.
 */
export const adminVideosApi = {
  /** Returns presigned PUT URLs for direct browser-to-S3 upload. */
  getUploadUrl: async (request?: UploadUrlRequest): Promise<UploadUrlResponse> => {
    const path = `${basePath}/upload-url`;
    const response = await ffpClient.post(path, request ?? {});

    return parseApiResponse(uploadUrlResponseSchema, response, { method: 'POST', path });
  },

  /** Creates a video record with metadata after successful S3 upload. */
  createVideo: async (input: CreateVideoInput): Promise<{ video: z.infer<typeof videoSchema> }> => {
    const path = basePath;
    const response = await ffpClient.post(path, input);

    return parseApiResponse(createVideoResponseSchema, response, { method: 'POST', path });
  },

  /** Lists all videos (all statuses) with pagination, search, and filters. */
  list: async (
    pagination: PaginationInput,
    filters: AdminVideoFilterInput,
    signal?: AbortSignal
  ): Promise<PaginatedAdminVideoResponse> => {
    const params: Record<string, string | undefined> = {
      page: String(pagination.page),
      pageSize: String(pagination.pageSize),
      sortBy: pagination.sortBy,
      sortDirection: pagination.sortDirection,
    };

    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.status) {
      params.status = filters.status;
    }

    if (filters.difficulty) {
      params.difficulty = filters.difficulty;
    }

    const response = await ffpClient.get(basePath, { params, signal });

    return parseApiResponse(paginatedAdminVideoResponseSchema, response, {
      method: 'GET',
      path: basePath,
    });
  },
};

// Re-export types for consumers
export type { CreateVideoInput, UploadUrlRequest, UploadUrlResponse };
