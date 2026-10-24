import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type * as ffpDatabase from '@ffp/database';

import { createSystemContext } from '../../src/lib/context';
import { ConflictError, NotFoundError, ValidationError } from '../../src/lib/errors';
import * as tagService from '../../src/tags/tag.service';
import { connectTestDb, type TestDb } from '../lib/test-db.fixture';

import {
  findCategoryId,
  inRolledBackTransaction,
  insertTestTag,
  shortId,
  type TestTx,
} from './tag-fixture';

import type { Pool } from 'pg';

// The services read through getDb, pointed at each test's rolled-back transaction
const serviceDb = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('@ffp/database', async (importOriginal) => ({
  ...(await importOriginal<typeof ffpDatabase>()),
  getDb: () => serviceDb.current,
}));

const ctx = createSystemContext({ systemId: 'tag-service-test', organisationId: 'org-test' });

describe('Tag service', () => {
  let pool: Pool;
  let db: TestDb;

  const run = (work: (tx: TestTx) => Promise<void>): Promise<void> =>
    inRolledBackTransaction(db, async (tx) => {
      serviceDb.current = tx;
      await work(tx);
    });

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  afterAll(async () => {
    await pool.end();
  });

  it('lists the seeded categories in order, with inactive tags flagged', async () => {
    await run(async (tx) => {
      const retired = await insertTestTag(tx, await findCategoryId(tx, 'audience'), {
        isActive: false,
      });

      const categories = await tagService.listTagCategoriesService(ctx);

      expect(categories.map((category) => category.slug)).toEqual([
        'goal',
        'body-area',
        'movement',
        'audience',
      ]);
      expect(categories[3].tags).toContainEqual({
        publicId: retired.publicId,
        slug: retired.slug,
        label: retired.label,
        category: 'audience',
        isActive: false,
      });
    });
  });

  it('creates a tag, and refuses its slug again in the same category', async () => {
    await run(async () => {
      const slug = `tag-test-${shortId()}`;

      const tag = await tagService.createTagService(ctx, {
        category: 'movement',
        slug,
        label: 'Tag test',
      });

      expect(tag).toMatchObject({ slug, label: 'Tag test', category: 'movement', isActive: true });
      await expect(
        tagService.createTagService(ctx, { category: 'movement', slug, label: 'Again' })
      ).rejects.toThrow(ConflictError);
    });
  });

  it('refuses a slug that is not kebab-case', async () => {
    await run(async () => {
      await expect(
        tagService.createTagService(ctx, { category: 'goal', slug: 'Not_Kebab', label: 'Bad' })
      ).rejects.toThrow(ValidationError);
    });
  });

  it('renames, deactivates and reactivates a tag by publicId', async () => {
    await run(async (tx) => {
      const tag = await insertTestTag(tx, await findCategoryId(tx, 'goal'));

      const renamed = await tagService.updateTagService(ctx, tag.publicId, { label: 'Renamed' });
      await tagService.deactivateTagService(ctx, tag.publicId);
      const afterDeactivate = await tagService.listTagCategoriesService(ctx);
      const reactivated = await tagService.updateTagService(ctx, tag.publicId, { isActive: true });

      expect(renamed.label).toBe('Renamed');
      expect(
        afterDeactivate[0].tags.find((candidate) => candidate.publicId === tag.publicId)?.isActive
      ).toBe(false);
      expect(reactivated.isActive).toBe(true);
    });
  });

  it('answers an unknown publicId with not found', async () => {
    await run(async () => {
      await expect(
        tagService.updateTagService(ctx, 'unknowntag01', { label: 'Nope' })
      ).rejects.toThrow(NotFoundError);
      await expect(tagService.deactivateTagService(ctx, 'unknowntag01')).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
