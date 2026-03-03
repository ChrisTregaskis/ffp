import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { templateSessions } from './template-sessions';
import { videos } from './videos';

/**
 * Session exercises table definition
 *
 * Links sessions to videos/exercises with prescribed parameters (sets, reps, duration).
 * Each exercise references a video from the catalogue and specifies the prescription
 * for that exercise within the session.
 *
 * System-managed lookup table — no RLS required.
 */
export const sessionExercises = pgTable(
  'session_exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Parent template session */
    templateSessionId: uuid('template_session_id')
      .notNull()
      .references(() => templateSessions.id, { onDelete: 'cascade' }),
    /** Exercise video — restrict deletion of videos used in templates */
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'restrict' }),
    /** Display order within the session (0-based) */
    orderIndex: integer('order_index').notNull(),
    /** Prescribed number of sets */
    sets: integer('sets').notNull().default(3),
    /** Prescribed reps — VARCHAR to support ranges and holds (e.g., "12", "8-12", "30s hold") */
    reps: varchar('reps', { length: 20 }).notNull().default('10'),
    /** Timed exercise duration in seconds (nullable — not all exercises are timed) */
    durationSeconds: integer('duration_seconds'),
    /** Rest period between sets in seconds */
    restSeconds: integer('rest_seconds'),
    /** Exercise-specific instructions from the physiotherapist */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_session_exercises_session_order').on(
      table.templateSessionId,
      table.orderIndex
    ),
    index('idx_session_exercises_session').on(table.templateSessionId),
    index('idx_session_exercises_video').on(table.videoId),
  ]
);

export const insertSessionExerciseSchema = createInsertSchema(sessionExercises);
export const selectSessionExerciseSchema = createSelectSchema(sessionExercises);
export type SessionExerciseRecord = typeof sessionExercises.$inferSelect;
export type NewSessionExercise = typeof sessionExercises.$inferInsert;
