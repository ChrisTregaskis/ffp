import { randomUUID } from 'crypto';

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { videos, type VideoRecord } from '@ffp/database/schema';

import * as videoRepository from '../../src/videos/video.repository';

// Videos are catalogue content (no RLS); each test removes the row it created
describe('Video repository', () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;
  let video: VideoRecord;

  beforeAll(() => {
    pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: 'ffp_test',
      user: process.env.DB_USER ?? 'test_user',
      password: process.env.DB_PASSWORD ?? 'test_password',
    });
    db = drizzle(pool);
  });

  beforeEach(async () => {
    video = await videoRepository.insertVideo(db, {
      title: 'Repository lookup test',
      // Unique per run, so a row left by an interrupted run can't collide on the unique key
      s3Key: `library/repository-lookup-test-${randomUUID()}.mp4`,
      durationSeconds: 30,
      fileSizeBytes: 1024,
      bodyParts: ['knee'],
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
