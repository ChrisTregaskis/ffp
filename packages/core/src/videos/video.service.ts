import { getDb, type DbQueryClient } from '@ffp/database';
import type { VideoRecord } from '@ffp/database/schema';

import { NotFoundError, ValidationError } from '../lib/errors';
import { createLogger } from '../lib/logger';
import { buildPaginationMeta } from '../schemas/pagination.schema';
import {
  createVideoSchema,
  updateVideoSchema,
  videoDetailResponseSchema,
  adminVideoDetailSchema,
  adminVideoFilterSchema,
  adminVideoListResponseSchema,
} from '../schemas/video/video.schema';
import * as videoTagService from '../tags/video-tag.service';

import { deleteVideoObject } from './video-upload.service';
import * as videoRepository from './video.repository';

import type { OrganisationContext } from '../lib/context';
import type { TenantLogger } from '../lib/logger';
import type { PaginationInput, PaginationMeta } from '../schemas/pagination.schema';
import type {
  VideoDetailResponse,
  AdminVideoDetail,
  AdminVideoListResponse,
} from '../schemas/video/video.schema';

/** Raw admin filter input before Zod validation */
interface AdminVideoFilterRawInput {
  search?: string;
  status?: string;
  difficulty?: string;
  tags?: string[];
}

/** Valid status transitions: current status → allowed next statuses */
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['active'],
  active: ['archived'],
  archived: ['draft', 'active'],
};

async function toAdminVideoDetail(
  db: DbQueryClient,
  record: VideoRecord
): Promise<AdminVideoDetail> {
  const tags = await videoTagService.findTagsOfVideo(db, record.id);

  return adminVideoDetailSchema.parse({ ...record, tags });
}

/** The records with their tags, parsed into a list response shape */
async function withTags<T>(
  db: DbQueryClient,
  records: VideoRecord[],
  parse: (video: VideoRecord & { tags: unknown }) => T
): Promise<T[]> {
  const tagsByVideo = await videoTagService.findTagsByVideoId(
    db,
    records.map((record) => record.id)
  );

  return records.map((record) => parse({ ...record, tags: tagsByVideo.get(record.id) }));
}

/**
 * A video an exercise may use, template or member: it must exist and be active. Either failure is
 * the caller's to correct, so both are a 400.
 */
export async function findExerciseVideo(db: DbQueryClient, videoId: string): Promise<VideoRecord> {
  const video = await videoRepository.findVideoById(db, videoId);

  if (!video) {
    throw new ValidationError('Video not found');
  }

  if (video.status !== 'active') {
    throw new ValidationError('Video is not active');
  }

  return video;
}

/**
 * Create a new video record with validated input, and its tags.
 * Status defaults to 'draft' via schema default.
 */
export async function createVideo(
  ctx: OrganisationContext,
  input: unknown
): Promise<AdminVideoDetail> {
  const { tags, ...validated } = createVideoSchema.parse(input);
  const db = getDb();
  const assignment = tags ? await videoTagService.resolveTagAssignment(db, tags) : [];

  const record = await db.transaction(async (tx) => {
    const inserted = await videoRepository.insertVideo(tx, validated);
    await videoTagService.writeTagAssignment(tx, inserted.id, assignment);

    return inserted;
  });

  const logger = createLogger(ctx);
  logger.info('Video record created', {
    action: 'video_created',
    videoId: record.id,
    s3Key: record.s3Key,
    status: record.status,
  });

  return await toAdminVideoDetail(db, record);
}

/** An active video, for members; draft and archived videos read as missing. */
export async function getVideo(
  _ctx: OrganisationContext,
  publicId: string
): Promise<VideoDetailResponse> {
  const db = getDb();
  const record = await videoRepository.findVideoByPublicId(db, publicId);

  if (record?.status !== 'active') {
    throw new NotFoundError('Video');
  }

  const tags = await videoTagService.findTagsOfVideo(db, record.id);

  return videoDetailResponseSchema.parse({ ...record, tags });
}

/** A video in any status, for the catalogue admin. */
export async function getAdminVideo(
  _ctx: OrganisationContext,
  publicId: string
): Promise<AdminVideoDetail> {
  const db = getDb();
  const record = await videoRepository.findVideoByPublicId(db, publicId);

  if (!record) {
    throw new NotFoundError('Video', publicId);
  }

  return await toAdminVideoDetail(db, record);
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
    data: await withTags(db, records, (video) => adminVideoListResponseSchema.parse(video)),
    pagination: buildPaginationMeta(paginationInput, total),
  };
}

/** Update a video's metadata, status and tags, resolved by public identifier. */
export async function updateVideo(
  ctx: OrganisationContext,
  publicId: string,
  input: unknown
): Promise<AdminVideoDetail> {
  const { tags, ...validated } = updateVideoSchema.parse(input);

  const db = getDb();
  const existing = await videoRepository.findVideoByPublicId(db, publicId);

  if (!existing) {
    throw new NotFoundError('Video', publicId);
  }

  if (validated.status && validated.status !== existing.status) {
    const allowed = VALID_STATUS_TRANSITIONS[existing.status] ?? [];

    if (!allowed.includes(validated.status)) {
      throw new ValidationError(
        `Cannot transition from '${existing.status}' to '${validated.status}'`
      );
    }
  }

  const assignment = tags
    ? await videoTagService.resolveTagAssignment(
        db,
        tags,
        await videoTagService.findTagsOfVideo(db, existing.id)
      )
    : [];

  const updated = await db.transaction(async (tx) => {
    const record = await videoRepository.updateVideo(tx, existing.id, validated);
    await videoTagService.writeTagAssignment(tx, existing.id, assignment);

    return record;
  });

  if (!updated) {
    throw new NotFoundError('Video', publicId);
  }

  const logger = createLogger(ctx);
  logger.info('Video updated', {
    action: 'video_updated',
    videoId: updated.id,
    status: updated.status,
    previousStatus: existing.status,
  });

  if (updated.s3Key !== existing.s3Key) {
    await deleteReplacedFile(logger, updated.id, existing.s3Key, updated.s3Key);
  }

  return await toAdminVideoDetail(db, updated);
}

/**
 * Remove the file a replacement superseded. Runs only once the new key has committed, so a
 * failed replace never loses the live file; a failed delete leaves an orphan to trace from the
 * log rather than failing a replace that has already landed.
 */
async function deleteReplacedFile(
  logger: TenantLogger,
  videoId: string,
  replacedS3Key: string,
  s3Key: string
): Promise<void> {
  try {
    await deleteVideoObject(replacedS3Key);
    logger.info('Replaced video file deleted', {
      action: 'video_file_replaced',
      videoId,
      replacedS3Key,
      s3Key,
    });
  } catch (error) {
    logger.error('Replaced video file could not be deleted', {
      action: 'video_file_delete_failed',
      videoId,
      replacedS3Key,
      s3Key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
