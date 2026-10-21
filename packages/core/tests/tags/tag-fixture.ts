import { randomUUID } from 'crypto';

import { asc, eq, TransactionRollbackError } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

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

export type TestDb = NodePgDatabase;
export type TestTx = Parameters<Parameters<TestDb['transaction']>[0]>[0];

export const createTestPool = (): Pool =>
  new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432'),
    database: 'ffp_test',
    user: process.env.DB_USER ?? 'test_user',
    password: process.env.DB_PASSWORD ?? 'test_password',
  });

export const createTestDb = (pool: Pool): TestDb => drizzle(pool);

/** Runs the work and rolls it back, so nothing a test writes outlives it. */
export async function inRolledBackTransaction(
  db: TestDb,
  work: (tx: TestTx) => Promise<void>
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await work(tx);
      tx.rollback();
    });
  } catch (error) {
    // Only the deliberate rollback is swallowed; a failing assertion surfaces as itself
    if (error instanceof TransactionRollbackError) {
      return;
    }

    throw error;
  }
}

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
