import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { connectTestDb, type TestDb } from '@ffp/database/testing';

import { findDriverError } from '../../src/lib/database-errors';
import * as tagRepository from '../../src/tags/tag.repository';

import {
  assignTags,
  findCategoryId,
  inRolledBackTransaction,
  insertTestTag,
  insertTestVideo,
} from './tag-fixture';

import type { Pool } from 'pg';

describe('Tag repository', () => {
  let pool: Pool;
  let db: TestDb;

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('findPoolVideos', () => {
    it('returns only active videos carrying a matching tag in the category', async () => {
      await inRolledBackTransaction(db, async (tx) => {
        const movementId = await findCategoryId(tx, 'movement');
        const tag = await insertTestTag(tx, movementId);
        const active = await insertTestVideo(tx);
        const draft = await insertTestVideo(tx, { status: 'draft' });
        const archived = await insertTestVideo(tx, { status: 'archived' });
        const untagged = await insertTestVideo(tx);

        for (const video of [active, draft, archived]) {
          await assignTags(tx, video.id, [tag.id]);
        }

        const pool = await tagRepository.findPoolVideos(tx, {
          categoryId: movementId,
          tagIds: [tag.id],
        });

        expect(pool.map((video) => video.id)).toEqual([active.id]);
        expect(pool.map((video) => video.id)).not.toContain(untagged.id);
      });
    });

    it('never returns an excluded video', async () => {
      await inRolledBackTransaction(db, async (tx) => {
        const movementId = await findCategoryId(tx, 'movement');
        const tag = await insertTestTag(tx, movementId);
        const picked = await insertTestVideo(tx);
        const remaining = await insertTestVideo(tx);
        await assignTags(tx, picked.id, [tag.id]);
        await assignTags(tx, remaining.id, [tag.id]);

        const pool = await tagRepository.findPoolVideos(tx, {
          categoryId: movementId,
          tagIds: [tag.id],
          excludeVideoIds: [picked.id],
        });

        expect(pool.map((video) => video.id)).toEqual([remaining.id]);
      });
    });

    it('draws only from the requested category', async () => {
      await inRolledBackTransaction(db, async (tx) => {
        const movementId = await findCategoryId(tx, 'movement');
        const bodyAreaId = await findCategoryId(tx, 'body-area');
        const bodyAreaTag = await insertTestTag(tx, bodyAreaId);
        const video = await insertTestVideo(tx);
        await assignTags(tx, video.id, [bodyAreaTag.id]);

        const wholeCategory = await tagRepository.findPoolVideos(tx, { categoryId: movementId });
        const otherCategoryTag = await tagRepository.findPoolVideos(tx, {
          categoryId: movementId,
          tagIds: [bodyAreaTag.id],
        });
        const ownCategory = await tagRepository.findPoolVideos(tx, { categoryId: bodyAreaId });

        expect(wholeCategory.map((row) => row.id)).not.toContain(video.id);
        expect(otherCategoryTag).toEqual([]);
        expect(ownCategory.map((row) => row.id)).toContain(video.id);
      });
    });

    it('ignores a deactivated tag', async () => {
      await inRolledBackTransaction(db, async (tx) => {
        const movementId = await findCategoryId(tx, 'movement');
        const inactive = await insertTestTag(tx, movementId, { isActive: false });
        const video = await insertTestVideo(tx);
        await assignTags(tx, video.id, [inactive.id]);

        const restricted = await tagRepository.findPoolVideos(tx, {
          categoryId: movementId,
          tagIds: [inactive.id],
        });
        const wholeCategory = await tagRepository.findPoolVideos(tx, { categoryId: movementId });

        expect(restricted).toEqual([]);
        expect(wholeCategory.map((row) => row.id)).not.toContain(video.id);
      });
    });

    it('puts a video with two movement tags in both pools, once each', async () => {
      await inRolledBackTransaction(db, async (tx) => {
        const movementId = await findCategoryId(tx, 'movement');
        const mobility = await insertTestTag(tx, movementId);
        const strength = await insertTestTag(tx, movementId);
        const video = await insertTestVideo(tx);
        await assignTags(tx, video.id, [mobility.id, strength.id]);

        const mobilityPool = await tagRepository.findPoolVideos(tx, {
          categoryId: movementId,
          tagIds: [mobility.id],
        });
        const strengthPool = await tagRepository.findPoolVideos(tx, {
          categoryId: movementId,
          tagIds: [strength.id],
        });
        const eitherPool = await tagRepository.findPoolVideos(tx, {
          categoryId: movementId,
          tagIds: [mobility.id, strength.id],
        });

        expect(mobilityPool.map((row) => row.id)).toEqual([video.id]);
        expect(strengthPool.map((row) => row.id)).toEqual([video.id]);
        expect(eitherPool.map((row) => row.id)).toEqual([video.id]);
      });
    });

    it('matches nothing for an empty tag set', async () => {
      await inRolledBackTransaction(db, async (tx) => {
        const movementId = await findCategoryId(tx, 'movement');
        const tag = await insertTestTag(tx, movementId);
        const video = await insertTestVideo(tx);
        await assignTags(tx, video.id, [tag.id]);

        await expect(
          tagRepository.findPoolVideos(tx, { categoryId: movementId, tagIds: [] })
        ).resolves.toEqual([]);
      });
    });
  });

  describe('tag slugs', () => {
    it('are unique within a category but may repeat across categories', async () => {
      await inRolledBackTransaction(db, async (tx) => {
        const movementId = await findCategoryId(tx, 'movement');
        const audienceId = await findCategoryId(tx, 'audience');
        const first = await insertTestTag(tx, movementId);

        await expect(insertTestTag(tx, audienceId, { slug: first.slug })).resolves.toMatchObject({
          slug: first.slug,
          categoryId: audienceId,
        });

        // A savepoint, so the rejected insert doesn't abort the surrounding transaction
        const duplicate = await tx
          .transaction((savepoint) => insertTestTag(savepoint, movementId, { slug: first.slug }))
          .then(
            () => null,
            (error: unknown) => error
          );

        expect(findDriverError(duplicate)).toMatchObject({
          code: '23505',
          constraint: 'idx_tags_category_slug',
        });
      });
    });
  });
});
