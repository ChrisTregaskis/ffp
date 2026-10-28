import { randomUUID } from 'crypto';

import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { videos, type VideoRecord } from '@ffp/database/schema';
import { connectTestDb, type TestDb } from '@ffp/database/testing';

import * as videoRepository from '../../src/videos/video.repository';
import { descendingIds, idsAcrossPages, minutesApart } from '../lib/paging.fixture';
import { inRolledBackTransaction, insertTestVideo } from '../tags/tag-fixture';

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

  // Rolled back, and every title carries this run's marker, which each listing searches by
  describe('findAllVideos', () => {
    const marker = randomUUID().slice(0, 8);

    it('orders rows tied on the sort column by id, so the pages neither repeat nor skip one', async () => {
      await inRolledBackTransaction(db, async (tx) => {
        const ids = descendingIds(6);

        for (const id of ids) {
          await insertTestVideo(tx, { id, title: `Tied video ${marker}` });
        }

        const listed = await idsAcrossPages(3, (page) =>
          videoRepository.findAllVideos(
            tx,
            { page, pageSize: 2, sortBy: 'title', sortDirection: 'asc' },
            { search: marker }
          )
        );

        expect(listed).toEqual([...ids].sort());
      });
    });

    it('lists the newest first when the request names no sort', async () => {
      await inRolledBackTransaction(db, async (tx) => {
        const ids: string[] = [];

        for (const createdAt of minutesApart(3)) {
          ids.push((await insertTestVideo(tx, { title: `Dated video ${marker}`, createdAt })).id);
        }

        const listed = await videoRepository.findAllVideos(
          tx,
          { page: 1, pageSize: 10, sortDirection: 'asc' },
          { search: marker }
        );

        expect(listed.map((listedVideo) => listedVideo.id)).toEqual([...ids].reverse());
      });
    });

    describe('a search holding a LIKE wildcard or escape character matches it literally', () => {
      it.each([
        { search: '50%', literal: '50% stretch', lookalike: '500 stretch' },
        { search: 'warm_up', literal: 'warm_up drill', lookalike: 'warm-up drill' },
        { search: 'back\\slash', literal: 'back\\slash drill', lookalike: 'backslash drill' },
      ])('$search', async ({ search, literal, lookalike }) => {
        await inRolledBackTransaction(db, async (tx) => {
          const match = await insertTestVideo(tx, { title: `${literal} ${marker}` });
          const nonMatch = await insertTestVideo(tx, { title: `${lookalike} ${marker}` });

          const listed = await videoRepository.findAllVideos(
            tx,
            { page: 1, pageSize: 100, sortDirection: 'asc' },
            { search }
          );

          const ours = listed
            .map((listedVideo) => listedVideo.id)
            .filter((id) => [match.id, nonMatch.id].includes(id));
          expect(ours).toEqual([match.id]);
        });
      });
    });
  });
});
