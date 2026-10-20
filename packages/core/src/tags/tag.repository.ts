import { and, asc, eq, exists, inArray, notInArray, sql, type SQL } from 'drizzle-orm';

import type { DbQueryClient } from '@ffp/database';
import type { TagCategorySlug } from '@ffp/database/constants';
import {
  tagCategories,
  tags,
  videos,
  videoTags,
  type NewTag,
  type TagCategoryRecord,
  type VideoRecord,
} from '@ffp/database/schema';

/** A tag with its category's slug */
export interface CategorisedTag {
  id: string;
  publicId: string;
  categoryId: string;
  category: TagCategorySlug;
  slug: string;
  label: string;
  isActive: boolean;
}

/** A tag on a video, with its category's slug */
export interface VideoTagRow {
  videoId: string;
  category: TagCategorySlug;
  publicId: string;
  slug: string;
  label: string;
}

const categorisedTagColumns = {
  id: tags.id,
  publicId: tags.publicId,
  categoryId: tags.categoryId,
  // The column is varchar; only the seeded slugs are ever stored
  category: sql<TagCategorySlug>`${tagCategories.slug}`,
  slug: tags.slug,
  label: tags.label,
  isActive: tags.isActive,
};

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

export async function findCategories(db: DbQueryClient): Promise<TagCategoryRecord[]> {
  return await db.select().from(tagCategories).orderBy(asc(tagCategories.displayOrder));
}

export async function findCategoryBySlug(
  db: DbQueryClient,
  slug: TagCategorySlug
): Promise<TagCategoryRecord | null> {
  const records = await db
    .select()
    .from(tagCategories)
    .where(eq(tagCategories.slug, slug))
    .limit(1);

  return records[0] ?? null;
}

/** Every tag, inactive ones included, by category order then label */
export async function findAllTags(db: DbQueryClient): Promise<CategorisedTag[]> {
  return await db
    .select(categorisedTagColumns)
    .from(tags)
    .innerJoin(tagCategories, eq(tagCategories.id, tags.categoryId))
    .orderBy(asc(tagCategories.displayOrder), asc(tags.label));
}

export async function findTagsByPublicIds(
  db: DbQueryClient,
  publicIds: string[]
): Promise<CategorisedTag[]> {
  if (publicIds.length === 0) {
    return [];
  }

  return await db
    .select(categorisedTagColumns)
    .from(tags)
    .innerJoin(tagCategories, eq(tagCategories.id, tags.categoryId))
    .where(inArray(tags.publicId, publicIds));
}

export async function findTagByPublicId(
  db: DbQueryClient,
  publicId: string
): Promise<CategorisedTag | null> {
  const records = await findTagsByPublicIds(db, [publicId]);

  return records[0] ?? null;
}

export async function findTagBySlug(
  db: DbQueryClient,
  categoryId: string,
  slug: string
): Promise<{ id: string } | null> {
  const records = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.categoryId, categoryId), eq(tags.slug, slug)))
    .limit(1);

  return records[0] ?? null;
}

export async function insertTag(
  db: DbQueryClient,
  input: NewTag
): Promise<{ id: string; publicId: string }> {
  const [record] = await db
    .insert(tags)
    .values(input)
    .returning({ id: tags.id, publicId: tags.publicId });

  return record;
}

export async function updateTag(
  db: DbQueryClient,
  tagId: string,
  data: { label?: string; isActive?: boolean }
): Promise<void> {
  await db
    .update(tags)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tags.id, tagId));
}

/** The tags on each of the videos, by category order then label */
export async function findVideoTags(db: DbQueryClient, videoIds: string[]): Promise<VideoTagRow[]> {
  if (videoIds.length === 0) {
    return [];
  }

  return await db
    .select({
      videoId: videoTags.videoId,
      category: sql<TagCategorySlug>`${tagCategories.slug}`,
      publicId: tags.publicId,
      slug: tags.slug,
      label: tags.label,
    })
    .from(videoTags)
    .innerJoin(tags, eq(tags.id, videoTags.tagId))
    .innerJoin(tagCategories, eq(tagCategories.id, tags.categoryId))
    .where(inArray(videoTags.videoId, videoIds))
    .orderBy(asc(tagCategories.displayOrder), asc(tags.label));
}

/** Make `tagIds` the video's tags in the category: others in the category go, missing ones are added */
export async function replaceVideoTagsInCategory(
  db: DbQueryClient,
  videoId: string,
  categoryId: string,
  tagIds: string[]
): Promise<void> {
  const inCategory = db.select({ id: tags.id }).from(tags).where(eq(tags.categoryId, categoryId));
  const removals: SQL[] = [eq(videoTags.videoId, videoId), inArray(videoTags.tagId, inCategory)];

  if (tagIds.length > 0) {
    removals.push(notInArray(videoTags.tagId, tagIds));
  }

  await db.delete(videoTags).where(and(...removals));

  if (tagIds.length > 0) {
    await db
      .insert(videoTags)
      .values(tagIds.map((tagId) => ({ videoId, tagId })))
      .onConflictDoNothing();
  }
}
