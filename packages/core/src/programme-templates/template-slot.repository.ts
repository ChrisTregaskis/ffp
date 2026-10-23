import { asc, eq, inArray, max, sql } from 'drizzle-orm';

import type { DbQueryClient } from '@ffp/database';
import type { TagCategorySlug } from '@ffp/database/constants';
import {
  tagCategories,
  tags,
  templateSessionSlots,
  templateSlotTags,
  type TemplateSessionSlotRecord,
} from '@ffp/database/schema';

/** A slot with its category's slug and label */
export interface SlotWithCategory extends TemplateSessionSlotRecord {
  category: TagCategorySlug;
  categoryLabel: string;
}

/** A tag a slot names */
export interface SlotTagRow {
  slotId: string;
  id: string;
  publicId: string;
  slug: string;
  label: string;
  isActive: boolean;
}

const slotWithCategoryColumns = {
  slot: templateSessionSlots,
  // The column is varchar; only the seeded slugs are ever stored
  category: sql<TagCategorySlug>`${tagCategories.slug}`,
  categoryLabel: tagCategories.label,
};

const toSlotWithCategory = (row: {
  slot: TemplateSessionSlotRecord;
  category: TagCategorySlug;
  categoryLabel: string;
}): SlotWithCategory => ({ ...row.slot, category: row.category, categoryLabel: row.categoryLabel });

/** Returns all slots for a session, ordered by orderIndex. */
export async function findSlotsBySessionId(
  db: DbQueryClient,
  sessionId: string
): Promise<SlotWithCategory[]> {
  const rows = await db
    .select(slotWithCategoryColumns)
    .from(templateSessionSlots)
    .innerJoin(tagCategories, eq(tagCategories.id, templateSessionSlots.tagCategoryId))
    .where(eq(templateSessionSlots.templateSessionId, sessionId))
    .orderBy(asc(templateSessionSlots.orderIndex));

  return rows.map(toSlotWithCategory);
}

/** Returns a single slot by public ID, or null if not found. */
export async function findSlotByPublicId(
  db: DbQueryClient,
  publicId: string
): Promise<SlotWithCategory | null> {
  const rows = await db
    .select(slotWithCategoryColumns)
    .from(templateSessionSlots)
    .innerJoin(tagCategories, eq(tagCategories.id, templateSessionSlots.tagCategoryId))
    .where(eq(templateSessionSlots.publicId, publicId))
    .limit(1);

  return rows[0] ? toSlotWithCategory(rows[0]) : null;
}

/** The tags each slot names, by label */
export async function findSlotTags(db: DbQueryClient, slotIds: string[]): Promise<SlotTagRow[]> {
  if (slotIds.length === 0) {
    return [];
  }

  return await db
    .select({
      slotId: templateSlotTags.slotId,
      id: tags.id,
      publicId: tags.publicId,
      slug: tags.slug,
      label: tags.label,
      isActive: tags.isActive,
    })
    .from(templateSlotTags)
    .innerJoin(tags, eq(tags.id, templateSlotTags.tagId))
    .where(inArray(templateSlotTags.slotId, slotIds))
    .orderBy(asc(tags.label));
}

/**
 * Inserts a new slot for a session.
 * Auto-assigns orderIndex as max(existing) + 1 (0-based).
 */
export async function insertSlot(
  db: DbQueryClient,
  sessionId: string,
  input: { tagCategoryId: string; isRequired: boolean; label: string | null }
): Promise<TemplateSessionSlotRecord> {
  const [result] = await db
    .select({ maxOrderIndex: max(templateSessionSlots.orderIndex) })
    .from(templateSessionSlots)
    .where(eq(templateSessionSlots.templateSessionId, sessionId));

  const nextOrderIndex = result.maxOrderIndex != null ? result.maxOrderIndex + 1 : 0;

  const records = await db
    .insert(templateSessionSlots)
    .values({ templateSessionId: sessionId, orderIndex: nextOrderIndex, ...input })
    .returning();

  return records[0];
}

export async function updateSlot(
  db: DbQueryClient,
  id: string,
  data: { tagCategoryId?: string; isRequired?: boolean; label?: string | null }
): Promise<void> {
  await db
    .update(templateSessionSlots)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(templateSessionSlots.id, id));
}

/** Make `tagIds` the slot's tags */
export async function replaceSlotTags(
  db: DbQueryClient,
  slotId: string,
  tagIds: string[]
): Promise<void> {
  await db.delete(templateSlotTags).where(eq(templateSlotTags.slotId, slotId));

  if (tagIds.length > 0) {
    await db.insert(templateSlotTags).values(tagIds.map((tagId) => ({ slotId, tagId })));
  }
}

/** Deletes a slot by ID. DB cascade removes its tags. */
export async function deleteSlot(db: DbQueryClient, id: string): Promise<void> {
  await db.delete(templateSessionSlots).where(eq(templateSessionSlots.id, id));
}

/**
 * Sets orderIndex to each slot's position in `orderedIds` (0-based). Goes through negative
 * values first, because the unique (session, orderIndex) index rejects a direct swap.
 */
export async function reorderSlots(db: DbQueryClient, orderedIds: string[]): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(templateSessionSlots)
      .set({ orderIndex: -(i + 1), updatedAt: new Date() })
      .where(eq(templateSessionSlots.id, orderedIds[i]));
  }

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(templateSessionSlots)
      .set({ orderIndex: i, updatedAt: new Date() })
      .where(eq(templateSessionSlots.id, orderedIds[i]));
  }
}

/** Closes the gap a deleted slot leaves, keeping orderIndex contiguous from 0. */
export async function renumberSlots(db: DbQueryClient, sessionId: string): Promise<void> {
  const slots = await findSlotsBySessionId(db, sessionId);

  for (const [index, slot] of slots.entries()) {
    if (slot.orderIndex !== index) {
      await db
        .update(templateSessionSlots)
        .set({ orderIndex: index, updatedAt: new Date() })
        .where(eq(templateSessionSlots.id, slot.id));
    }
  }
}
