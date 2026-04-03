import {
  pgTable,
  uuid,
  boolean,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { organisations } from './organisations';
import { userSessions } from './user-sessions';
import { sessionExercises } from './session-exercises';
import { videos } from './videos';

/**
 * Exercise completions table definition
 *
 * Tracks individual exercise completion status within a user session.
 * Created lazily when a session is started (one row per session exercise).
 * Supports the cascading completion engine — when all exercises complete,
 * the parent session automatically completes.
 *
 * video_id is intentionally denormalised — avoids join through session_exercises
 * for "show completions by video" queries.
 *
 * **RLS enforced** — organisation_id column with row-level security policies.
 */
export const exerciseCompletions = pgTable(
  'exercise_completions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Organisation for RLS isolation */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Parent user session — cascade delete when session is removed */
    userSessionId: uuid('user_session_id')
      .notNull()
      .references(() => userSessions.id, { onDelete: 'cascade' }),
    /** Template exercise reference — restrict deletion of exercises in use */
    sessionExerciseId: uuid('session_exercise_id')
      .notNull()
      .references(() => sessionExercises.id, { onDelete: 'restrict' }),
    /** Denormalised video reference — restrict deletion of videos in use */
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'restrict' }),
    /** Whether the exercise was completed */
    completed: boolean('completed').notNull().default(false),
    /** When marked complete */
    completedAt: timestamp('completed_at'),
    /** Whether the exercise was skipped */
    skipped: boolean('skipped').notNull().default(false),
    /** User notes (e.g., "left knee felt tight") */
    notes: text('notes'),
    /** Variable optional data (pain_level, modifications, etc.) */
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_exercise_completions_session_exercise').on(
      table.userSessionId,
      table.sessionExerciseId
    ),
    index('idx_exercise_completions_organisation').on(table.organisationId),
    index('idx_exercise_completions_session').on(table.userSessionId),
    index('idx_exercise_completions_video').on(table.videoId),
  ]
);

export const insertExerciseCompletionSchema = createInsertSchema(exerciseCompletions);
export const selectExerciseCompletionSchema = createSelectSchema(exerciseCompletions);
export type ExerciseCompletionRecord = typeof exerciseCompletions.$inferSelect;
export type NewExerciseCompletion = typeof exerciseCompletions.$inferInsert;
