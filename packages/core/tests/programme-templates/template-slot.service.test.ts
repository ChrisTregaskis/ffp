import { asc, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type * as ffpDatabase from '@ffp/database';
import {
  programmeTemplates,
  tags,
  templateSessionSlots,
  templateSlotTags,
} from '@ffp/database/schema';
import { connectTestDb, type TestDb } from '@ffp/database/testing';

import { NotFoundError, ValidationError } from '../../src/lib/errors';
import { deleteSession } from '../../src/programme-templates/template-session.service';
import * as slotService from '../../src/programme-templates/template-slot.service';
import * as tagRepository from '../../src/tags/tag.repository';
import { inRolledBackTransaction, type TestTx } from '../lib/rolled-back-transaction.fixture';
import { assignTags, findCategoryId, insertTestTag, insertTestVideo } from '../tags/tag-fixture';

import { insertTemplateWithSession, type TemplateFixture } from './template-fixture';

import type { Pool } from 'pg';

// The services read through getDb, pointed at each test's rolled-back transaction
const serviceDb = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('@ffp/database', async (importOriginal) => ({
  ...(await importOriginal<typeof ffpDatabase>()),
  getDb: () => serviceDb.current,
}));

/** The session's stored slots in order, each with its tag ids */
async function readSlots(
  tx: TestTx,
  sessionId: string
): Promise<{ publicId: string; orderIndex: number; tagIds: string[] }[]> {
  const slots = await tx
    .select()
    .from(templateSessionSlots)
    .where(eq(templateSessionSlots.templateSessionId, sessionId))
    .orderBy(asc(templateSessionSlots.orderIndex));
  const slotTags = await tx.select().from(templateSlotTags);

  return slots.map((slot) => ({
    publicId: slot.publicId,
    orderIndex: slot.orderIndex,
    tagIds: slotTags
      .filter((row) => row.slotId === slot.id)
      .map((row) => row.tagId)
      .sort(),
  }));
}

describe('Template slot service', () => {
  let pool: Pool;
  let db: TestDb;

  const run = (work: (tx: TestTx, fixture: TemplateFixture) => Promise<void>): Promise<void> =>
    inRolledBackTransaction(db, async (tx) => {
      serviceDb.current = tx;
      await work(tx, await insertTemplateWithSession(tx));
    });

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('writes', () => {
    it('appends slots in order with their tags', async () => {
      await run(async (tx, { session }) => {
        const movementId = await findCategoryId(tx, 'movement');
        const tag = await insertTestTag(tx, movementId);

        const first = await slotService.createSlot(session.id, {
          category: 'movement',
          tags: [tag.publicId],
          label: '  Warm-up  ',
        });
        const second = await slotService.createSlot(session.id, {
          category: 'body-area',
          isRequired: false,
        });

        expect(first).toMatchObject({ orderIndex: 0, category: 'movement', label: 'Warm-up' });
        expect(first.isRequired).toBe(true);
        expect(second).toMatchObject({ orderIndex: 1, category: 'body-area', isRequired: false });
        expect(await readSlots(tx, session.id)).toEqual([
          { publicId: first.publicId, orderIndex: 0, tagIds: [tag.id] },
          { publicId: second.publicId, orderIndex: 1, tagIds: [] },
        ]);
      });
    });

    it('refuses a tag from another category and writes nothing', async () => {
      await run(async (tx, { session }) => {
        const bodyAreaTag = await insertTestTag(tx, await findCategoryId(tx, 'body-area'));

        await expect(
          slotService.createSlot(session.id, { category: 'movement', tags: [bodyAreaTag.publicId] })
        ).rejects.toBeInstanceOf(ValidationError);

        const slot = await slotService.createSlot(session.id, { category: 'movement' });

        await expect(
          slotService.updateSlot(slot.publicId, { tags: [bodyAreaTag.publicId] })
        ).rejects.toBeInstanceOf(ValidationError);
        expect(await readSlots(tx, session.id)).toEqual([
          { publicId: slot.publicId, orderIndex: 0, tagIds: [] },
        ]);
      });
    });

    it('refuses a sixth slot with a 400', async () => {
      await run(async (tx, { session }) => {
        for (let i = 0; i < 5; i++) {
          await slotService.createSlot(session.id, { category: 'movement' });
        }

        await expect(
          slotService.createSlot(session.id, { category: 'movement' })
        ).rejects.toMatchObject({ statusCode: 400 });
        expect(await readSlots(tx, session.id)).toHaveLength(5);
      });
    });

    it('clears the old category tags when only the category changes', async () => {
      await run(async (tx, { session }) => {
        const tag = await insertTestTag(tx, await findCategoryId(tx, 'movement'));
        const slot = await slotService.createSlot(session.id, {
          category: 'movement',
          tags: [tag.publicId],
          label: 'Strength',
        });

        const updated = await slotService.updateSlot(slot.publicId, { category: 'audience' });

        expect(updated).toMatchObject({ category: 'audience', tags: [], label: 'Strength' });
        expect((await readSlots(tx, session.id))[0].tagIds).toEqual([]);
      });
    });

    it('keeps a deactivated tag the slot already names, but will not add one', async () => {
      await run(async (tx, { session }) => {
        const movementId = await findCategoryId(tx, 'movement');
        const kept = await insertTestTag(tx, movementId);
        const retired = await insertTestTag(tx, movementId, { isActive: false });
        const slot = await slotService.createSlot(session.id, {
          category: 'movement',
          tags: [kept.publicId],
        });
        await tx.update(tags).set({ isActive: false }).where(eq(tags.id, kept.id));

        const resaved = await slotService.updateSlot(slot.publicId, {
          tags: [kept.publicId],
          label: '',
        });

        expect(resaved.tags.map((tag) => tag.publicId)).toEqual([kept.publicId]);
        expect(resaved.label).toBeNull();
        await expect(
          slotService.updateSlot(slot.publicId, { tags: [kept.publicId, retired.publicId] })
        ).rejects.toBeInstanceOf(ValidationError);
      });
    });

    it('deletes a slot and closes the gap in the order', async () => {
      await run(async (tx, { session }) => {
        const tag = await insertTestTag(tx, await findCategoryId(tx, 'movement'));
        const [first, middle, last] = [
          await slotService.createSlot(session.id, { category: 'movement' }),
          await slotService.createSlot(session.id, { category: 'movement', tags: [tag.publicId] }),
          await slotService.createSlot(session.id, { category: 'movement' }),
        ];

        await slotService.deleteSlot(middle.publicId);

        expect(await readSlots(tx, session.id)).toEqual([
          { publicId: first.publicId, orderIndex: 0, tagIds: [] },
          { publicId: last.publicId, orderIndex: 1, tagIds: [] },
        ]);
        expect(
          await tx.select().from(templateSlotTags).where(eq(templateSlotTags.tagId, tag.id))
        ).toEqual([]);
        await expect(slotService.deleteSlot(middle.publicId)).rejects.toBeInstanceOf(NotFoundError);
      });
    });
  });

  describe('reorder', () => {
    it('stores the order given', async () => {
      await run(async (tx, { session }) => {
        const created = [
          await slotService.createSlot(session.id, { category: 'movement' }),
          await slotService.createSlot(session.id, { category: 'body-area' }),
          await slotService.createSlot(session.id, { category: 'audience' }),
        ];
        const reversed = created.map((slot) => slot.publicId).reverse();

        const result = await slotService.reorderSlots(session.id, { orderedIds: reversed });

        expect(result.slots.map((slot) => slot.publicId)).toEqual(reversed);
        expect((await readSlots(tx, session.id)).map((slot) => slot.publicId)).toEqual(reversed);
      });
    });

    it('refuses a duplicate id with a 400 and leaves the order alone', async () => {
      await run(async (tx, { session }) => {
        const first = await slotService.createSlot(session.id, { category: 'movement' });
        const second = await slotService.createSlot(session.id, { category: 'body-area' });

        await expect(
          slotService.reorderSlots(session.id, { orderedIds: [second.publicId, second.publicId] })
        ).rejects.toMatchObject({ statusCode: 400 });
        expect((await readSlots(tx, session.id)).map((slot) => slot.publicId)).toEqual([
          first.publicId,
          second.publicId,
        ]);
      });
    });

    it("refuses another session's slot", async () => {
      await run(async (tx, { session }) => {
        const other = await insertTemplateWithSession(tx);
        const own = await slotService.createSlot(session.id, { category: 'movement' });
        const foreign = await slotService.createSlot(other.session.id, { category: 'movement' });

        await expect(
          slotService.reorderSlots(session.id, { orderedIds: [foreign.publicId] })
        ).rejects.toBeInstanceOf(ValidationError);
        expect((await readSlots(tx, session.id)).map((slot) => slot.publicId)).toEqual([
          own.publicId,
        ]);
      });
    });
  });

  describe('authoring flags', () => {
    it('sizes a named-tag pool from active videos carrying an active named tag', async () => {
      await run(async (tx, { session }) => {
        const movementId = await findCategoryId(tx, 'movement');
        const named = await insertTestTag(tx, movementId);
        const unnamed = await insertTestTag(tx, movementId);
        for (const video of [
          await insertTestVideo(tx),
          await insertTestVideo(tx),
          await insertTestVideo(tx, { status: 'draft' }),
        ]) {
          await assignTags(tx, video.id, [named.id]);
        }
        await assignTags(tx, (await insertTestVideo(tx)).id, [unnamed.id]);

        await slotService.createSlot(session.id, { category: 'movement', tags: [named.publicId] });
        const { slots } = await slotService.listSlots(session.id);

        expect(slots[0]).toMatchObject({ poolSize: 2, isPoolEmpty: false, hasInactiveTags: false });
      });
    });

    it('sizes a slot naming no tags from the whole category, as the pool query does', async () => {
      await run(async (tx, { session }) => {
        const movementId = await findCategoryId(tx, 'movement');
        const tag = await insertTestTag(tx, movementId);
        await assignTags(tx, (await insertTestVideo(tx)).id, [tag.id]);

        await slotService.createSlot(session.id, { category: 'movement' });
        const { slots } = await slotService.listSlots(session.id);
        const pool = await tagRepository.findPoolVideos(tx, { categoryId: movementId });

        expect(slots[0].poolSize).toBeGreaterThan(0);
        expect(slots[0].poolSize).toBe(pool.length);
        expect(slots[0].isPoolEmpty).toBe(false);
      });
    });

    it('flags an inactive tag, and an empty pool once only inactive tags remain', async () => {
      await run(async (tx, { session }) => {
        const movementId = await findCategoryId(tx, 'movement');
        const staying = await insertTestTag(tx, movementId);
        const retiring = await insertTestTag(tx, movementId);
        const onlyRetiring = await insertTestTag(tx, movementId);
        await assignTags(tx, (await insertTestVideo(tx)).id, [staying.id]);
        await assignTags(tx, (await insertTestVideo(tx)).id, [retiring.id]);
        await assignTags(tx, (await insertTestVideo(tx)).id, [onlyRetiring.id]);
        await slotService.createSlot(session.id, {
          category: 'movement',
          tags: [staying.publicId, retiring.publicId],
        });
        await slotService.createSlot(session.id, {
          category: 'movement',
          tags: [onlyRetiring.publicId],
        });
        await tx.update(tags).set({ isActive: false }).where(eq(tags.id, retiring.id));
        await tx.update(tags).set({ isActive: false }).where(eq(tags.id, onlyRetiring.id));

        const { slots } = await slotService.listSlots(session.id);

        expect(slots[0]).toMatchObject({ poolSize: 1, isPoolEmpty: false, hasInactiveTags: true });
        expect(slots[0].tags.find((tag) => tag.publicId === retiring.publicId)?.isActive).toBe(
          false
        );
        expect(slots[1]).toMatchObject({ poolSize: 0, isPoolEmpty: true, hasInactiveTags: true });
      });
    });

    it('flags a session with fewer than three slots', async () => {
      await run(async (_tx, { session }) => {
        await slotService.createSlot(session.id, { category: 'movement' });
        await slotService.createSlot(session.id, { category: 'movement' });

        expect((await slotService.listSlots(session.id)).hasTooFewSlots).toBe(true);

        await slotService.createSlot(session.id, { category: 'movement' });

        expect((await slotService.listSlots(session.id)).hasTooFewSlots).toBe(false);
      });
    });
  });

  describe('cascade', () => {
    it("removes a session's slots and their tags with the session", async () => {
      await run(async (tx, { session }) => {
        const tag = await insertTestTag(tx, await findCategoryId(tx, 'movement'));
        await slotService.createSlot(session.id, { category: 'movement', tags: [tag.publicId] });

        await deleteSession(session.id);

        expect(await readSlots(tx, session.id)).toEqual([]);
        expect(
          await tx.select().from(templateSlotTags).where(eq(templateSlotTags.tagId, tag.id))
        ).toEqual([]);
      });
    });

    it("removes a template's slots with the template", async () => {
      await run(async (tx, { template, session }) => {
        await slotService.createSlot(session.id, { category: 'movement' });

        await tx.delete(programmeTemplates).where(eq(programmeTemplates.id, template.id));

        expect(await readSlots(tx, session.id)).toEqual([]);
      });
    });
  });
});
