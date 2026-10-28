import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { connectTestDb, type TestDb } from '@ffp/database/testing';

import * as videoRepository from '../../src/videos/video.repository';
import { inRolledBackTransaction, type TestTx } from '../lib/rolled-back-transaction.fixture';
import { assignTags, findCategoryId, insertTestTag, insertTestVideo } from '../tags/tag-fixture';

import type { Pool } from 'pg';

const PAGE = { page: 1, pageSize: 50, sortBy: 'title', sortDirection: 'asc' } as const;

// Every tag is the test's own, so only the test's videos can match a filter on them
describe('Video repository tag filter', () => {
  let pool: Pool;
  let db: TestDb;

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  afterAll(async () => {
    await pool.end();
  });

  const matching = async (tx: TestTx, tagPublicIds: string[]): Promise<string[]> => {
    const records = await videoRepository.findAllVideos(tx, PAGE, { tags: tagPublicIds });
    const total = await videoRepository.countAllVideos(tx, { tags: tagPublicIds });

    expect(total).toBe(records.length);

    return records.map((video) => video.id).sort();
  };

  it('narrows across categories and widens within one', async () => {
    await inRolledBackTransaction(db, async (tx) => {
      const goalId = await findCategoryId(tx, 'goal');
      const movementId = await findCategoryId(tx, 'movement');
      const posture = await insertTestTag(tx, goalId);
      const energy = await insertTestTag(tx, goalId);
      const strength = await insertTestTag(tx, movementId);

      const postureStrength = await insertTestVideo(tx);
      const energyStrength = await insertTestVideo(tx);
      const postureOnly = await insertTestVideo(tx);
      const strengthOnly = await insertTestVideo(tx);
      await assignTags(tx, postureStrength.id, [posture.id, strength.id]);
      await assignTags(tx, energyStrength.id, [energy.id, strength.id]);
      await assignTags(tx, postureOnly.id, [posture.id]);
      await assignTags(tx, strengthOnly.id, [strength.id]);

      // Goal: posture AND movement: strength
      expect(await matching(tx, [posture.publicId, strength.publicId])).toEqual([
        postureStrength.id,
      ]);
      // Goal: posture OR goal: energy
      expect(await matching(tx, [posture.publicId, energy.publicId])).toEqual(
        [postureStrength.id, energyStrength.id, postureOnly.id].sort()
      );
      // (posture OR energy) AND strength
      expect(await matching(tx, [posture.publicId, energy.publicId, strength.publicId])).toEqual(
        [postureStrength.id, energyStrength.id].sort()
      );
    });
  });

  it('matches nothing for a tag that does not exist', async () => {
    await inRolledBackTransaction(db, async (tx) => {
      const strength = await insertTestTag(tx, await findCategoryId(tx, 'movement'));
      const video = await insertTestVideo(tx);
      await assignTags(tx, video.id, [strength.id]);

      expect(await matching(tx, [strength.publicId, 'unknowntag01'])).toEqual([]);
    });
  });
});
