import { and, eq, exists, inArray, notInArray, sql, type SQL } from 'drizzle-orm';

import type { DbQueryClient } from '@ffp/database';
import { tags, videos, videoTags, type VideoRecord } from '@ffp/database/schema';

export interface PoolVideoQuery {
  categoryId: string;
  /** Omit to draw from every active tag in the category */
  tagIds?: string[];
  /** Videos already picked */
  excludeVideoIds?: string[];
}

/**
 * Active videos with at least one active tag in the category (or in `tagIds`), minus
 * `excludeVideoIds`. An empty `tagIds` matches nothing. EXISTS rather than a join, so a video
 * with several matching tags is returned once.
 */
export async function findPoolVideos(
  db: DbQueryClient,
  query: PoolVideoQuery
): Promise<VideoRecord[]> {
  const tagConditions: SQL[] = [
    eq(videoTags.videoId, videos.id),
    eq(tags.categoryId, query.categoryId),
    eq(tags.isActive, true),
  ];

  if (query.tagIds) {
    tagConditions.push(inArray(tags.id, query.tagIds));
  }

  const conditions: SQL[] = [
    eq(videos.status, 'active'),
    exists(
      db
        .select({ one: sql`1` })
        .from(videoTags)
        .innerJoin(tags, eq(tags.id, videoTags.tagId))
        .where(and(...tagConditions))
    ),
  ];

  if (query.excludeVideoIds && query.excludeVideoIds.length > 0) {
    conditions.push(notInArray(videos.id, query.excludeVideoIds));
  }

  return await db
    .select()
    .from(videos)
    .where(and(...conditions))
    .orderBy(videos.title);
}
