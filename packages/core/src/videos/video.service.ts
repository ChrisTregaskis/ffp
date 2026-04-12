import { getDb } from '@ffp/database';
import type { VideoRecord } from '@ffp/database/schema';

import { NotFoundError, ValidationError } from '../lib/errors';
import { createLogger } from '../lib/logger';
import { buildPaginationMeta } from '../schemas/pagination.schema';
import {
  createVideoSchema,
  updateVideoSchema,
  videoFilterSchema,
  videoListResponseSchema,
  videoDetailResponseSchema,
  adminVideoFilterSchema,
  adminVideoListResponseSchema,
} from '../schemas/video/video.schema';

import * as videoRepository from './video.repository';

import type { OrganisationContext } from '../lib/context';
import type { PaginationInput, PaginationMeta } from '../schemas/pagination.schema';
import type {
  VideoListResponse,
  VideoDetailResponse,
  AdminVideoListResponse,
} from '../schemas/video/video.schema';

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

/** Raw admin filter input before Zod validation */
interface AdminVideoFilterRawInput {
  search?: string;
  status?: string;
  difficulty?: string;
}

/** Valid status transitions: current status → allowed next statuses */
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['active'],
  active: ['archived'],
  archived: ['draft', 'active'],
};

/**
 * Create a new video record with validated input.
 * Status defaults to 'draft' via schema default.
 */
export async function createVideo(ctx: OrganisationContext, input: unknown): Promise<VideoRecord> {
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

export async function listVideos(_ctx: OrganisationContext): Promise<VideoListResponse[]> {
  const db = getDb();
  const records = await videoRepository.findAllActive(db);

  return records.map((record) => videoListResponseSchema.parse(record));
}

export async function getVideo(
  _ctx: OrganisationContext,
  publicId: string,
  options: GetVideoOptions = {}
): Promise<VideoDetailResponse> {
  const db = getDb();
  const record = await videoRepository.findVideoByPublicId(db, publicId);

  if (!record) {
    throw new NotFoundError('Video');
  }

  if (!options.includeInactive && record.status !== 'active') {
    throw new NotFoundError('Video');
  }

  return videoDetailResponseSchema.parse(record);
}

export async function listVideosByFilter(
  _ctx: OrganisationContext,
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

export async function listAdminVideos(
  _ctx: OrganisationContext,
  paginationInput: PaginationInput,
  rawFilters: AdminVideoFilterRawInput
): Promise<{ data: AdminVideoListResponse[]; pagination: PaginationMeta }> {
  const parseResult = adminVideoFilterSchema.safeParse(rawFilters);

  if (!parseResult.success) {
    throw new ValidationError('Invalid admin video filter parameters', {
      errors: parseResult.error.issues,
    });
  }

  const filters = parseResult.data;
  const db = getDb();

  const records = await videoRepository.findAllVideos(db, paginationInput, filters);
  const total = await videoRepository.countAllVideos(db, filters);

  return {
    data: records.map((record) => adminVideoListResponseSchema.parse(record)),
    pagination: buildPaginationMeta(paginationInput, total),
  };
}

export async function updateVideo(
  ctx: OrganisationContext,
  videoId: string,
  input: unknown
): Promise<VideoDetailResponse> {
  const validated = updateVideoSchema.parse(input);

  const db = getDb();
  const existing = await videoRepository.findVideoById(db, videoId);

  if (!existing) {
    throw new NotFoundError('Video');
  }

  if (validated.status && validated.status !== existing.status) {
    const allowed = VALID_STATUS_TRANSITIONS[existing.status] ?? [];

    if (!allowed.includes(validated.status)) {
      throw new ValidationError(
        `Cannot transition from '${existing.status}' to '${validated.status}'`
      );
    }
  }

  const updated = await videoRepository.updateVideo(db, videoId, validated);

  if (!updated) {
    throw new NotFoundError('Video');
  }

  const logger = createLogger(ctx);
  logger.info('Video updated', {
    action: 'video_updated',
    videoId: updated.id,
    status: updated.status,
    previousStatus: existing.status,
  });

  return videoDetailResponseSchema.parse(updated);
}
