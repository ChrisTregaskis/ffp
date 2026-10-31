import { randomUUID } from 'crypto';

import { asc, eq } from 'drizzle-orm';

import type { TagCategorySlug } from '@ffp/database/constants';
import {
  tagCategories,
  tags,
  videos,
  videoTags,
  type NewVideo,
  type TagRecord,
  type VideoRecord,
} from '@ffp/database/schema';

import type { TestTx } from '../lib/rolled-back-transaction.fixture';

export const shortId = (): string => randomUUID().replace(/-/g, '').slice(0, 12);

export async function insertTestVideo(
  tx: TestTx,
  overrides: Partial<NewVideo> = {}
): Promise<VideoRecord> {
  const [video] = await tx
    .insert(videos)
    .values({
      title: `Tag test ${shortId()}`,
      s3Key: `library/tag-test-${randomUUID()}.mp4`,
      durationSeconds: 30,
      fileSizeBytes: 1024,
      status: 'active',
      equipment: [],
      ...overrides,
    })
    .returning();

  return video;
}

export async function findCategoryId(tx: TestTx, slug: TagCategorySlug): Promise<string> {
  const [category] = await tx
    .select({ id: tagCategories.id })
    .from(tagCategories)
    .where(eq(tagCategories.slug, slug));

  return category.id;
}

/** A throwaway tag with a unique slug, so a pool restricted to it holds only this test's videos */
export async function insertTestTag(
  tx: TestTx,
  categoryId: string,
  overrides: { slug?: string; isActive?: boolean } = {}
): Promise<TagRecord> {
  const slug = overrides.slug ?? `tag-test-${shortId()}`;
  const [tag] = await tx
    .insert(tags)
    .values({ categoryId, slug, label: slug, isActive: overrides.isActive ?? true })
    .returning();

  return tag;
}

export async function assignTags(tx: TestTx, videoId: string, tagIds: string[]): Promise<void> {
  await tx.insert(videoTags).values(tagIds.map((tagId) => ({ videoId, tagId })));
}

/** A video's tags as sorted `category:tag` slugs */
export async function readVideoTagKeys(tx: TestTx, videoId: string): Promise<string[]> {
  const rows = await tx
    .select({ category: tagCategories.slug, tag: tags.slug })
    .from(videoTags)
    .innerJoin(tags, eq(tags.id, videoTags.tagId))
    .innerJoin(tagCategories, eq(tagCategories.id, tags.categoryId))
    .where(eq(videoTags.videoId, videoId))
    .orderBy(asc(tagCategories.slug), asc(tags.slug));

  return rows.map((row) => `${row.category}:${row.tag}`);
}
