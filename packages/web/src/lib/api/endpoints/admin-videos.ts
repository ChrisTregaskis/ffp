import type {
  AdminVideoDetail,
  AdminVideoFilterInput,
  CreateVideoInput,
  PaginationInput,
  UpdateVideoInput,
  UploadUrlResponse,
} from '@ffp/core';
import {
  adminVideoResponseSchema,
  paginatedAdminVideoResponseSchema,
  uploadUrlResponseSchema,
} from '@ffp/core';

import { ffpClient, parseApiResponse, toListParams } from '../client';

import type { z } from 'zod';

const basePath = '/admin/videos';

/** Paginated admin video list response type */
export type PaginatedAdminVideoResponse = z.infer<typeof paginatedAdminVideoResponseSchema>;

/**
 * Admin Video API methods
 * These endpoints require system_admin role.
 */
export const adminVideosApi = {
  /** Returns a presigned PUT URL for direct browser-to-S3 upload. */
  getUploadUrl: async (): Promise<UploadUrlResponse> => {
    const path = `${basePath}/upload-url`;
    const response = await ffpClient.post(path, {});

    return parseApiResponse(uploadUrlResponseSchema, response, { method: 'POST', path });
  },

  /** Lists all videos (all statuses) with pagination, search, and filters. */
  list: async (
    pagination: PaginationInput,
    filters: AdminVideoFilterInput,
    signal?: AbortSignal
  ): Promise<PaginatedAdminVideoResponse> => {
    const response = await ffpClient.get(basePath, {
      params: toListParams(pagination, filters),
      signal,
    });

    return parseApiResponse(paginatedAdminVideoResponseSchema, response, {
      method: 'GET',
      path: basePath,
    });
  },

  /** One video in any status, with its tags. */
  get: async (publicId: string, signal?: AbortSignal): Promise<AdminVideoDetail> => {
    const path = `${basePath}/${publicId}`;
    const response = await ffpClient.get(path, { signal });

    return parseApiResponse(adminVideoResponseSchema, response, { method: 'GET', path }).video;
  },

  /** Creates a video record with metadata after successful S3 upload. */
  createVideo: async (input: CreateVideoInput): Promise<AdminVideoDetail> => {
    const path = basePath;
    const response = await ffpClient.post(path, input);

    return parseApiResponse(adminVideoResponseSchema, response, { method: 'POST', path }).video;
  },

  /** Updates video metadata and tags (partial update including status transitions). */
  updateVideo: async (publicId: string, data: UpdateVideoInput): Promise<AdminVideoDetail> => {
    const path = `${basePath}/${publicId}`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(adminVideoResponseSchema, response, { method: 'PUT', path }).video;
  },
};
