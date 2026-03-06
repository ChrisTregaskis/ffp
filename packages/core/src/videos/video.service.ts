import { getDb } from '@ffp/database';
import type { VideoRecord } from '@ffp/database/schema';

import { NotFoundError, ValidationError } from '../lib/errors';
import { createLogger } from '../lib/logger';
import {
  createVideoSchema,
  videoFilterSchema,
  videoListResponseSchema,
  videoDetailResponseSchema,
} from '../schemas/video.schema';

import * as videoRepository from './video.repository';

import type { TenantContext } from '../lib/context';
import type { VideoListResponse, VideoDetailResponse } from '../schemas/video.schema';

interface GetVideoOptions {
  /** When true, returns the video regardless of status. Defaults to false (active only). */
  includeInactive?: boolean;
}

/** Raw filter input before Zod validation — accepts unvalidated string values */
interface VideoFilterRawInput {
  bodyParts?: string[];
  equipment?: string[];
  difficulty?: string;
  movementType?: string;
  tags?: string[];
}

/**
 * Create a new video record with validated input.
 * Status defaults to 'draft' via schema default.
 */
export async function createVideo(ctx: TenantContext, input: unknown): Promise<VideoRecord> {
  const validated = createVideoSchema.parse(input);
  const db = getDb();
  const record = await videoRepository.insertVideo(db, validated);

  const logger = createLogger(ctx);
  logger.info('Video record created', {
    action: 'video_created',
    videoId: record.id,
    s3Key: record.s3Key,
    status: record.status,
  });

  return record;
}

export async function listVideos(_ctx: TenantContext): Promise<VideoListResponse[]> {
  const db = getDb();
  const records = await videoRepository.findAllActive(db);

  return records.map((record) => videoListResponseSchema.parse(record));
}

export async function getVideo(
  _ctx: TenantContext,
  videoId: string,
  options: GetVideoOptions = {}
): Promise<VideoDetailResponse> {
  const db = getDb();
  const record = await videoRepository.findVideoById(db, videoId);

  if (!record) {
    throw new NotFoundError('Video');
  }

  if (!options.includeInactive && record.status !== 'active') {
    throw new NotFoundError('Video');
  }

  return videoDetailResponseSchema.parse(record);
}

export async function listVideosByFilter(
  _ctx: TenantContext,
  filters: VideoFilterRawInput
): Promise<VideoListResponse[]> {
  const parseResult = videoFilterSchema.safeParse(filters);

  if (!parseResult.success) {
    throw new ValidationError('Invalid video filter parameters', {
      errors: parseResult.error.issues,
    });
  }

  const db = getDb();
  const records = await videoRepository.findByFilters(db, parseResult.data);

  return records.map((record) => videoListResponseSchema.parse(record));
}
