import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as ffpDatabase from '@ffp/database';

import { createSystemContext } from '../../src/lib/context';
import { NotFoundError, ValidationError } from '../../src/lib/errors';
import {
  createVideo,
  getAdminVideo,
  getVideo,
  listAdminVideos,
  updateVideo,
} from '../../src/videos/video.service';
import {
  assignTags,
  createTestDb,
  createTestPool,
  findCategoryId,
  inRolledBackTransaction,
  insertTestTag,
  insertTestVideo,
  readVideoTagKeys,
  type TestDb,
  type TestTx,
} from '../tags/tag-fixture';

import type { Pool } from 'pg';

// The services read through getDb, pointed at each test's rolled-back transaction
const serviceDb = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('@ffp/database', async (importOriginal) => ({
  ...(await importOriginal<typeof ffpDatabase>()),
  getDb: () => serviceDb.current,
}));

const ctx = createSystemContext({ systemId: 'video-tags-test', organisationId: 'org-test' });

const STORAGE_FIELDS = ['s3Key', 'fileSizeBytes', 'mimeType'];

describe('Video service with typed tags', () => {
  let pool: Pool;
  let db: TestDb;

  const run = (work: (tx: TestTx) => Promise<void>): Promise<void> =>
    inRolledBackTransaction(db, async (tx) => {
      serviceDb.current = tx;
      await work(tx);
    });

  beforeAll(() => {
    pool = createTestPool();
    db = createTestDb(pool);
  });

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('reads a draft video for the admin with its tags, and no storage fields', async () => {
    await run(async (tx) => {
      const movement = await insertTestTag(tx, await findCategoryId(tx, 'movement'));
      const video = await insertTestVideo(tx, { status: 'draft', isEssential: true });
      await assignTags(tx, video.id, [movement.id]);

      const detail = await getAdminVideo(ctx, video.publicId);

      expect(detail.isEssential).toBe(true);
      expect(detail.tags.movement).toEqual([
        { publicId: movement.publicId, slug: movement.slug, label: movement.label },
      ]);
      expect(detail.tags.goal).toEqual([]);
      for (const field of STORAGE_FIELDS) {
        expect(detail).not.toHaveProperty(field);
      }
    });
  });

  it('hides a draft video from members', async () => {
    await run(async (tx) => {
      const video = await insertTestVideo(tx, { status: 'draft' });

      await expect(getVideo(ctx, video.publicId)).rejects.toThrow(NotFoundError);
    });
  });

  it('resolves an update by publicId, never by UUID', async () => {
    await run(async (tx) => {
      const video = await insertTestVideo(tx);

      await expect(updateVideo(ctx, video.id, { title: 'By UUID' })).rejects.toThrow(NotFoundError);
      const updated = await updateVideo(ctx, video.publicId, { title: 'By publicId' });

      expect(updated.title).toBe('By publicId');
      for (const field of STORAGE_FIELDS) {
        expect(updated).not.toHaveProperty(field);
      }
    });
  });

  it('answers an unknown publicId with not found', async () => {
    await run(async () => {
      await expect(getAdminVideo(ctx, 'unknownvid01')).rejects.toThrow(NotFoundError);
      await expect(updateVideo(ctx, 'unknownvid01', { title: 'Nope' })).rejects.toThrow(
        NotFoundError
      );
    });
  });

  it('replaces only the categories sent', async () => {
    await run(async (tx) => {
      const movementId = await findCategoryId(tx, 'movement');
      const strength = await insertTestTag(tx, movementId);
      const cardio = await insertTestTag(tx, movementId);
      const stretch = await insertTestTag(tx, movementId);
      const core = await insertTestTag(tx, await findCategoryId(tx, 'body-area'));
      const seated = await insertTestTag(tx, await findCategoryId(tx, 'audience'));
      const video = await insertTestVideo(tx);
      await assignTags(tx, video.id, [strength.id, core.id, seated.id]);

      await updateVideo(ctx, video.publicId, {
        tags: { movement: [cardio.publicId, stretch.publicId], 'body-area': [] },
      });

      expect(await readVideoTagKeys(tx, video.id)).toEqual(
        [`audience:${seated.slug}`, `movement:${cardio.slug}`, `movement:${stretch.slug}`].sort()
      );
    });
  });

  it('refuses a tag sent under the wrong category, and leaves the video as it was', async () => {
    await run(async (tx) => {
      const core = await insertTestTag(tx, await findCategoryId(tx, 'body-area'));
      const video = await insertTestVideo(tx);

      await expect(
        updateVideo(ctx, video.publicId, { title: 'Changed', tags: { movement: [core.publicId] } })
      ).rejects.toThrow(ValidationError);
      expect((await getAdminVideo(ctx, video.publicId)).title).toBe(video.title);
      expect(await readVideoTagKeys(tx, video.id)).toEqual([]);
    });
  });

  it('refuses a newly assigned inactive tag but keeps one the video already carries', async () => {
    await run(async (tx) => {
      const movementId = await findCategoryId(tx, 'movement');
      const carried = await insertTestTag(tx, movementId, { isActive: false });
      const retired = await insertTestTag(tx, movementId, { isActive: false });
      const video = await insertTestVideo(tx);
      await assignTags(tx, video.id, [carried.id]);

      await expect(
        updateVideo(ctx, video.publicId, {
          tags: { movement: [carried.publicId, retired.publicId] },
        })
      ).rejects.toThrow(ValidationError);
      await updateVideo(ctx, video.publicId, { tags: { movement: [carried.publicId] } });

      expect(await readVideoTagKeys(tx, video.id)).toEqual([`movement:${carried.slug}`]);
    });
  });

  it('creates a video with its tags, and no storage fields in the response', async () => {
    await run(async (tx) => {
      const balance = await insertTestTag(tx, await findCategoryId(tx, 'movement'));

      const created = await createVideo(ctx, {
        title: 'Created with tags',
        s3Key: 'library/created-with-tags.mp4',
        durationSeconds: 45,
        fileSizeBytes: 2048,
        equipment: [],
        tags: { movement: [balance.publicId] },
      });

      expect(created.tags.movement.map((tag) => tag.publicId)).toEqual([balance.publicId]);
      for (const field of STORAGE_FIELDS) {
        expect(created).not.toHaveProperty(field);
      }
    });
  });

  it('filters the admin list to videos carrying any of the tags', async () => {
    await run(async (tx) => {
      const audienceId = await findCategoryId(tx, 'audience');
      const gentle = await insertTestTag(tx, audienceId);
      const seated = await insertTestTag(tx, audienceId);
      const both = await insertTestVideo(tx, { status: 'draft' });
      const onlySeated = await insertTestVideo(tx);
      await insertTestVideo(tx);
      await assignTags(tx, both.id, [gentle.id, seated.id]);
      await assignTags(tx, onlySeated.id, [seated.id]);

      const { data, pagination } = await listAdminVideos(
        ctx,
        { page: 1, pageSize: 50, sortBy: 'title', sortDirection: 'asc' },
        { tags: [gentle.publicId, seated.publicId] }
      );

      expect(data.map((video) => video.publicId).sort()).toEqual(
        [both.publicId, onlySeated.publicId].sort()
      );
      expect(pagination.total).toBe(2);
      for (const field of STORAGE_FIELDS) {
        expect(data[0]).not.toHaveProperty(field);
      }
    });
  });
});
