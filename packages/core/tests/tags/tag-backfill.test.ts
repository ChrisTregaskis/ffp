import { readFileSync } from 'fs';
import { resolve } from 'path';

import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { MOVEMENT_TYPES } from '@ffp/database/constants';

import { connectTestDb, type TestDb } from '../lib/test-db.fixture';

import {
  inRolledBackTransaction,
  insertTestVideo,
  readVideoTagKeys,
  type TestTx,
} from './tag-fixture';

import type { Pool } from 'pg';

const TAG_MIGRATION = resolve(
  __dirname,
  '../../../database/migrations/0033_melted_krista_starr.sql'
);

/** The migration's seed and backfill statements, run as written. */
const backfillStatements = (): string[] =>
  readFileSync(TAG_MIGRATION, 'utf8')
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter((statement) => statement.includes('INSERT INTO'));

const runBackfill = async (tx: TestTx): Promise<void> => {
  for (const statement of backfillStatements()) {
    await tx.execute(sql.raw(statement));
  }
};

/** Body parts as stored before typed tags */
const STORED_BODY_PARTS = [
  'ankles',
  'biceps',
  'calves',
  'chest',
  'core',
  'glutes',
  'hamstrings',
  'hip_flexors',
  'lower_back',
  'quadriceps',
  'shoulders',
  'spine',
  'triceps',
  'upper_back',
];

/** Every free-form tag stored before typed tags */
const STORED_FREE_FORM_TAGS = [
  'ankle',
  'balance',
  'beginner-friendly',
  'compound',
  'fall-prevention',
  'functional',
  'gentle',
  'glutes',
  'lower-body',
  'mobility',
  'modified',
  'overhead',
  'post-surgery',
  'posterior-chain',
  'posture',
  'progressive',
  'proprioception',
  'rehabilitation',
  'seated',
  'spinal',
  'standing',
  'upper-body',
  'warm-up',
];

describe('Typed tag backfill', () => {
  let pool: Pool;
  let db: TestDb;

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  afterAll(async () => {
    await pool.end();
  });

  it('runs the seed and backfill statements the migration carries', () => {
    expect(backfillStatements()).toHaveLength(6);
  });

  it('turns every movement type into its movement tag', async () => {
    await inRolledBackTransaction(db, async (tx) => {
      const videos = [];
      for (const movementType of MOVEMENT_TYPES) {
        videos.push({ movementType, video: await insertTestVideo(tx, { movementType }) });
      }

      await runBackfill(tx);

      for (const { movementType, video } of videos) {
        await expect(readVideoTagKeys(tx, video.id)).resolves.toEqual([`movement:${movementType}`]);
      }
    });
  });

  it('turns every stored body part into a body-area tag, unknown ones included', async () => {
    await inRolledBackTransaction(db, async (tx) => {
      const video = await insertTestVideo(tx, {
        bodyParts: [...STORED_BODY_PARTS, 'Inner thigh'],
      });

      await runBackfill(tx);

      const expected = [...STORED_BODY_PARTS, 'inner-thigh']
        .map((part) => `body-area:${part.replace(/_/g, '-')}`)
        .sort();
      await expect(readVideoTagKeys(tx, video.id)).resolves.toEqual(expected);

      const created = await tx.execute<{ label: string }>(
        sql`SELECT label FROM tags WHERE slug = 'inner-thigh'`
      );
      expect(created.rows).toEqual([{ label: 'Inner thigh' }]);
    });
  });

  it('promotes only the triaged free-form tags', async () => {
    await inRolledBackTransaction(db, async (tx) => {
      const video = await insertTestVideo(tx, { tags: STORED_FREE_FORM_TAGS });

      await runBackfill(tx);

      await expect(readVideoTagKeys(tx, video.id)).resolves.toEqual([
        'audience:beginner-friendly',
        'audience:gentle',
        'audience:seated',
        'body-area:ankles',
        'body-area:glutes',
        'body-area:spine',
        'goal:posture',
        'movement:balance',
        'movement:mobility',
      ]);
    });
  });

  it('folds a free-form duplicate of the movement type into one movement tag', async () => {
    await inRolledBackTransaction(db, async (tx) => {
      const video = await insertTestVideo(tx, { movementType: 'balance', tags: ['balance'] });

      await runBackfill(tx);
      await runBackfill(tx);

      await expect(readVideoTagKeys(tx, video.id)).resolves.toEqual(['movement:balance']);
    });
  });
});
