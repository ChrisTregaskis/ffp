import { getDb } from '@ffp/database';

import { NotFoundError, ValidationError } from '../lib/errors';
import {
  videoFilterSchema,
  videoListResponseSchema,
  videoDetailResponseSchema,
} from '../schemas/video.schema';

import * as videoRepository from './video.repository';

import type { TenantContext } from '../lib/context';
import type { VideoListResponse, VideoDetailResponse } from '../schemas/video.schema';

export async function listVideos(_ctx: TenantContext): Promise<VideoListResponse[]> {
  const db = getDb();
  const records = await videoRepository.findAllActive(db);

  return records.map((record) => videoListResponseSchema.parse(record));
}

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
