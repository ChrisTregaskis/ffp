import { getDb, type DbQueryClient } from '@ffp/database';

import { assertDistinctIds } from '../lib/distinct-ids';
import { NotFoundError, ValidationError } from '../lib/errors';
import {
  SESSION_SLOT_LIMITS,
  createSlotRequestSchema,
  reorderSlotsRequestSchema,
  slotResponseSchema,
  updateSlotRequestSchema,
} from '../schemas/programme/programme.schema';
import * as tagRepository from '../tags/tag.repository';
import * as videoTagService from '../tags/video-tag.service';

import * as sessionRepository from './template-session.repository';
import * as slotRepository from './template-slot.repository';

import type { SlotTagRow, SlotWithCategory } from './template-slot.repository';
import type { SessionSlotsResponse, SlotResponse } from '../schemas/programme/programme.schema';
import type { VideoTags } from '../schemas/tag.schema';
import type { PoolVideoQuery } from '../tags/tag.repository';

/**
 * The pool a slot draws from: the tags it names, or its whole category when it names none.
 * Count and draw a slot's pool through this, so the size authors see is the pool drawn from.
 */
export function toSlotPoolQuery(categoryId: string, tagIds: string[]): PoolVideoQuery {
  return tagIds.length > 0 ? { categoryId, tagIds } : { categoryId };
}

async function toSlotResponses(
  db: DbQueryClient,
  slots: SlotWithCategory[]
): Promise<SlotResponse[]> {
  const slotTags = await slotRepository.findSlotTags(
    db,
    slots.map((slot) => slot.id)
  );

  return await Promise.all(
    slots.map(async (slot) => {
      const tags = slotTags.filter((tag) => tag.slotId === slot.id);
      const poolSize = await tagRepository.countPoolVideos(
        db,
        toSlotPoolQuery(
          slot.tagCategoryId,
          tags.map((tag) => tag.id)
        )
      );

      return slotResponseSchema.parse({
        ...slot,
        tags,
        poolSize,
        isPoolEmpty: poolSize === 0,
        hasInactiveTags: tags.some((tag) => !tag.isActive),
      });
    })
  );
}

async function readSessionSlots(
  db: DbQueryClient,
  sessionId: string
): Promise<SessionSlotsResponse> {
  const slots = await toSlotResponses(db, await slotRepository.findSlotsBySessionId(db, sessionId));

  return { slots, hasTooFewSlots: slots.length < SESSION_SLOT_LIMITS.min };
}

async function readSlot(db: DbQueryClient, publicId: string): Promise<SlotResponse> {
  const slot = await slotRepository.findSlotByPublicId(db, publicId);

  if (!slot) {
    throw new NotFoundError('Template slot', publicId);
  }

  const [response] = await toSlotResponses(db, [slot]);

  return response;
}

async function assertSessionExists(db: DbQueryClient, sessionId: string): Promise<void> {
  const session = await sessionRepository.findSessionById(db, sessionId);

  if (!session) {
    throw new NotFoundError('Template session', sessionId);
  }
}

/** A slot's tags as `resolveTagAssignment` expects the ones already carried */
const carriedTags = (
  category: SlotWithCategory['category'],
  tags: SlotTagRow[]
): Partial<VideoTags> => ({
  [category]: tags.map(({ publicId, slug, label }) => ({ publicId, slug, label })),
});

/** Returns a session's slots in order, each with its live pool size and warnings. */
export async function listSlots(sessionId: string): Promise<SessionSlotsResponse> {
  const db = getDb();

  await assertSessionExists(db, sessionId);

  return await readSessionSlots(db, sessionId);
}

/** Adds a slot at the end of a session. A session holds at most `SESSION_SLOT_LIMITS.max`. */
export async function createSlot(sessionId: string, input: unknown): Promise<SlotResponse> {
  const validated = createSlotRequestSchema.parse(input);
  const db = getDb();

  return await db.transaction(async (tx) => {
    await assertSessionExists(tx, sessionId);

    const existing = await slotRepository.findSlotsBySessionId(tx, sessionId);

    if (existing.length >= SESSION_SLOT_LIMITS.max) {
      throw new ValidationError(`A session holds at most ${String(SESSION_SLOT_LIMITS.max)} slots`);
    }

    const [{ categoryId, tagIds }] = await videoTagService.resolveTagAssignment(tx, {
      [validated.category]: validated.tags,
    });

    const slot = await slotRepository.insertSlot(tx, sessionId, {
      tagCategoryId: categoryId,
      isRequired: validated.isRequired,
      label: validated.label ?? null,
    });

    await slotRepository.replaceSlotTags(tx, slot.id, tagIds);

    return await readSlot(tx, slot.publicId);
  });
}

/**
 * Updates a slot. Sent tags replace the slot's tags; a new category without tags clears them,
 * since every tag must sit in the slot's category.
 */
export async function updateSlot(publicId: string, input: unknown): Promise<SlotResponse> {
  const validated = updateSlotRequestSchema.parse(input);
  const db = getDb();

  return await db.transaction(async (tx) => {
    const slot = await slotRepository.findSlotByPublicId(tx, publicId);

    if (!slot) {
      throw new NotFoundError('Template slot', publicId);
    }

    const category = validated.category ?? slot.category;
    const tagPublicIds = validated.tags ?? (category === slot.category ? undefined : []);
    let resolved: { categoryId: string; tagIds: string[] } | undefined;

    if (tagPublicIds) {
      const current = await slotRepository.findSlotTags(tx, [slot.id]);

      [resolved] = await videoTagService.resolveTagAssignment(
        tx,
        { [category]: tagPublicIds },
        carriedTags(slot.category, current)
      );
    }

    await slotRepository.updateSlot(tx, slot.id, {
      tagCategoryId: resolved?.categoryId,
      isRequired: validated.isRequired,
      label: validated.label,
    });

    if (resolved) {
      await slotRepository.replaceSlotTags(tx, slot.id, resolved.tagIds);
    }

    return await readSlot(tx, publicId);
  });
}

/** Deletes a slot and closes the gap in its session's order. */
export async function deleteSlot(publicId: string): Promise<void> {
  const db = getDb();

  await db.transaction(async (tx) => {
    const slot = await slotRepository.findSlotByPublicId(tx, publicId);

    if (!slot) {
      throw new NotFoundError('Template slot', publicId);
    }

    await slotRepository.deleteSlot(tx, slot.id);
    await slotRepository.renumberSlots(tx, slot.templateSessionId);
  });
}

/** Reorders a session's slots; `orderedIds` must name every slot of the session once. */
export async function reorderSlots(
  sessionId: string,
  input: unknown
): Promise<SessionSlotsResponse> {
  const validated = reorderSlotsRequestSchema.parse(input);
  const db = getDb();

  return await db.transaction(async (tx) => {
    await assertSessionExists(tx, sessionId);

    assertDistinctIds(validated.orderedIds, 'Slot');

    const existing = await slotRepository.findSlotsBySessionId(tx, sessionId);
    const idsByPublicId = new Map(existing.map((slot) => [slot.publicId, slot.id]));
    const orderedIds = validated.orderedIds.flatMap((id) => idsByPublicId.get(id) ?? []);

    if (orderedIds.length !== validated.orderedIds.length) {
      throw new ValidationError('One or more slot IDs do not belong to this session');
    }

    if (orderedIds.length !== existing.length) {
      throw new ValidationError(
        `Expected ${String(existing.length)} slot IDs but received ${String(orderedIds.length)}`
      );
    }

    await slotRepository.reorderSlots(tx, orderedIds);

    return await readSessionSlots(tx, sessionId);
  });
}
