import { Pool } from 'pg';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import {
  sessionExercises,
  tagCategories,
  tags,
  templateSessionSlots,
  templateSlotTags,
  videoTags,
} from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import { TEMPLATE_SESSION_IDS } from './seedTemplateHierarchy.js';

const logger = createLogger('seed-template-slots');

/**
 * Seeds slots onto the seeded template sessions from their fixed exercises: one required
 * movement slot per exercise, in order, naming the movement tags that exercise's video carries
 * (none named means the whole category).
 *
 * This seed is IDEMPOTENT — a session that already has slots is skipped.
 *
 * Must run AFTER seedTemplateHierarchy and seedVideos (reads exercises and video tags).
 * Note: template_session_slots has NO RLS (system-managed lookup table).
 */
export const seedTemplateSlots = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<number> => {
  logger.info('Seeding template session slots...');

  const [movement] = await db
    .select({ id: tagCategories.id })
    .from(tagCategories)
    .where(eq(tagCategories.slug, 'movement'));

  if (!movement) {
    throw new Error('The movement tag category is missing; run the migrations first');
  }

  let createdCount = 0;

  for (const sessionId of Object.values(TEMPLATE_SESSION_IDS)) {
    // One transaction per session: the skip below treats any slot as a finished session
    createdCount += await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: templateSessionSlots.id })
        .from(templateSessionSlots)
        .where(eq(templateSessionSlots.templateSessionId, sessionId))
        .limit(1);

      if (existing.length > 0) {
        logger.warn(`Template session already has slots: id=${sessionId}`);
        return 0;
      }

      const exercises = await tx
        .select({ videoId: sessionExercises.videoId })
        .from(sessionExercises)
        .where(eq(sessionExercises.templateSessionId, sessionId))
        .orderBy(asc(sessionExercises.orderIndex));

      const movementTags =
        exercises.length > 0
          ? await tx
              .select({ videoId: videoTags.videoId, tagId: videoTags.tagId })
              .from(videoTags)
              .innerJoin(tags, eq(tags.id, videoTags.tagId))
              .where(
                and(
                  inArray(
                    videoTags.videoId,
                    exercises.map((exercise) => exercise.videoId)
                  ),
                  eq(tags.categoryId, movement.id)
                )
              )
          : [];

      for (const [orderIndex, exercise] of exercises.entries()) {
        const [slot] = await tx
          .insert(templateSessionSlots)
          .values({
            templateSessionId: sessionId,
            orderIndex,
            tagCategoryId: movement.id,
            isRequired: true,
          })
          .returning({ id: templateSessionSlots.id });

        const tagIds = movementTags
          .filter((row) => row.videoId === exercise.videoId)
          .map((row) => row.tagId);

        if (tagIds.length > 0) {
          await tx
            .insert(templateSlotTags)
            .values(tagIds.map((tagId) => ({ slotId: slot.id, tagId })));
        }
      }

      logger.info('Template session slots created', { sessionId, slots: exercises.length });

      return exercises.length;
    });
  }

  logger.info('Template session slots seed complete', { created: createdCount });

  return createdCount;
};
