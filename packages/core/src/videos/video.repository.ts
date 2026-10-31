import { and, eq, or, ilike, count, sql, type SQL, type Column } from 'drizzle-orm';
import { z } from 'zod';

import type { DbClient, DbQueryClient } from '@ffp/database';
import { tags, videos, videoTags, type VideoRecord, type NewVideo } from '@ffp/database/schema';

import {
  applyPagination,
  escapeLikePattern,
  NEWEST_FIRST,
  withDefaultSort,
} from '../lib/pagination';

import type { PaginationInput } from '../schemas/pagination.schema';
import type { AdminVideoFilterInput, UpdateVideoInput } from '../schemas/video/video.schema';

/** Columns available for sorting on the admin video list */
const ADMIN_SORTABLE_COLUMNS: Partial<Record<string, Column>> = {
  title: videos.title,
  status: videos.status,
  difficulty: videos.difficulty,
  durationSeconds: videos.durationSeconds,
  createdAt: videos.createdAt,
  updatedAt: videos.updatedAt,
};

/**
 * A video matches when, for every category a selected tag belongs to, it carries at least one of
 * the selected tags in that category: AND across categories, OR within one. A selected publicId
 * that names no tag has no category the video can satisfy, so it matches nothing.
 */
const matchesTagsInEveryCategory = (tagPublicIds: string[]): SQL => {
  const selected = sql.join(
    tagPublicIds.map((publicId) => sql`${publicId}`),
    sql`, `
  );

  return sql`NOT EXISTS (
    SELECT 1
    FROM unnest(ARRAY[${selected}]::text[]) AS selected (public_id)
    LEFT JOIN ${tags} AS selected_tag ON selected_tag.public_id = selected.public_id
    WHERE NOT EXISTS (
      SELECT 1
      FROM ${videoTags} AS carried
      JOIN ${tags} AS carried_tag ON carried_tag.id = carried.tag_id
      WHERE carried.video_id = ${videos.id}
        AND carried_tag.category_id = selected_tag.category_id
        AND carried_tag.public_id IN (${selected})
    )
  )`;
};

/** Build WHERE conditions for admin video list filters. */
const buildAdminFilterConditions = (filters: AdminVideoFilterInput): SQL[] => {
  const conditions: SQL[] = [];

  if (filters.search) {
    const pattern = `%${escapeLikePattern(filters.search)}%`;
    const searchCondition = or(ilike(videos.title, pattern), ilike(videos.description, pattern));

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  if (filters.status) {
    conditions.push(eq(videos.status, filters.status));
  }

  if (filters.difficulty) {
    conditions.push(eq(videos.difficulty, filters.difficulty));
  }

  if (filters.tags && filters.tags.length > 0) {
    conditions.push(matchesTagsInEveryCategory(filters.tags));
  }

  return conditions;
};

export async function insertVideo(db: DbQueryClient, input: NewVideo): Promise<VideoRecord> {
  const records = await db.insert(videos).values(input).returning();

  return records[0];
}

export async function findVideoById(
  db: DbQueryClient,
  videoId: string
): Promise<VideoRecord | null> {
  const records = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);

  return records[0] ?? null;
}

export async function findVideoByPublicId(
  db: DbClient,
  publicId: string
): Promise<VideoRecord | null> {
  const records = await db.select().from(videos).where(eq(videos.publicId, publicId)).limit(1);

  return records[0] ?? null;
}

/**
 * Look up a video by UUID or publicId.
 *
 * Compares the uuid `id` column only when the value is UUID-shaped: Postgres rejects any other
 * value at the cast (22P02) before an OR could match `public_id`, and a 12-character publicId is
 * never UUID-shaped.
 */
export async function findVideoByIdOrPublicId(
  db: DbClient,
  identifier: string
): Promise<VideoRecord | null> {
  const column = z.guid().safeParse(identifier).success ? videos.id : videos.publicId;
  const records = await db.select().from(videos).where(eq(column, identifier)).limit(1);

  return records[0] ?? null;
}

/**
 * Returns all videos (any status) with pagination and optional filters.
 * For admin use — no status restriction applied by default.
 */
export async function findAllVideos(
  db: DbQueryClient,
  paginationInput: PaginationInput,
  filters: AdminVideoFilterInput
): Promise<VideoRecord[]> {
  const conditions = buildAdminFilterConditions(filters);

  const query = db
    .select()
    .from(videos)
    .where(and(...conditions))
    .$dynamic();

  return await applyPagination(
    query,
    withDefaultSort(paginationInput, ADMIN_SORTABLE_COLUMNS, NEWEST_FIRST),
    ADMIN_SORTABLE_COLUMNS,
    videos.id
  );
}

export async function countAllVideos(
  db: DbQueryClient,
  filters: AdminVideoFilterInput
): Promise<number> {
  const conditions = buildAdminFilterConditions(filters);

  const result = await db
    .select({ count: count() })
    .from(videos)
    .where(and(...conditions));

  return result[0].count;
}

export async function updateVideo(
  db: DbQueryClient,
  videoId: string,
  data: Omit<UpdateVideoInput, 'tags'>
): Promise<VideoRecord | null> {
  const records = await db
    .update(videos)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(videos.id, videoId))
    .returning();

  return records[0] ?? null;
}
