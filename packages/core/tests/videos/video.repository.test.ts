import { randomUUID } from 'crypto';

import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { videos, type VideoRecord } from '@ffp/database/schema';

import * as videoRepository from '../../src/videos/video.repository';
import { connectTestDb, type TestDb } from '../lib/test-db.fixture';

import type { Pool } from 'pg';

// Videos are catalogue content (no RLS); each test removes the row it created
describe('Video repository', () => {
  let pool: Pool;
  let db: TestDb;
  let video: VideoRecord;

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  beforeEach(async () => {
    video = await videoRepository.insertVideo(db, {
      title: 'Repository lookup test',
      // Unique per run, so a row left by an interrupted run can't collide on the unique key
      s3Key: `library/repository-lookup-test-${randomUUID()}.mp4`,
      durationSeconds: 30,
      fileSizeBytes: 1024,
      equipment: [],
    });
  });

  afterEach(async () => {
    await db.delete(videos).where(eq(videos.id, video.id));
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('findVideoByIdOrPublicId', () => {
    it('finds a video by its UUID', async () => {
      const found = await videoRepository.findVideoByIdOrPublicId(db, video.id);

      expect(found?.id).toBe(video.id);
    });

    it('finds a video by its publicId', async () => {
      const found = await videoRepository.findVideoByIdOrPublicId(db, video.publicId);

      expect(found?.id).toBe(video.id);
    });

    it('returns null for an unknown identifier of either shape', async () => {
      await expect(
        videoRepository.findVideoByIdOrPublicId(db, '00000000-0000-4000-8000-000000000000')
      ).resolves.toBeNull();
      await expect(videoRepository.findVideoByIdOrPublicId(db, 'unknownVideo')).resolves.toBeNull();
    });
  });
});
