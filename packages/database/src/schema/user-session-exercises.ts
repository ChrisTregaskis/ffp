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

import { organisations } from './organisations';
import { sessionExercises } from './session-exercises';
import { userSessions } from './user-sessions';
import { videos } from './videos';

/**
 * User session exercises table definition
 *
 * A member's own copy of a session's exercises, written at programme creation, so a
 * template edit only affects programmes created after it.
 *
 * **RLS enforced** — organisation_id column with row-level security policies.
 */
export const userSessionExercises = pgTable(
  'user_session_exercises',
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
    /** Template exercise copied from — set null on delete so a copy never blocks template authoring */
    sourceSessionExerciseId: uuid('source_session_exercise_id').references(
      () => sessionExercises.id,
      { onDelete: 'set null' }
    ),
    /** Exercise video — restrict deletion of videos used in a member's programme */
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
    /** Exercise-specific instructions */
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_user_session_exercises_session_order').on(
      table.userSessionId,
      table.orderIndex
    ),
    index('idx_user_session_exercises_organisation').on(table.organisationId),
    index('idx_user_session_exercises_session').on(table.userSessionId),
    index('idx_user_session_exercises_video').on(table.videoId),
  ]
);

export const insertUserSessionExerciseSchema = createInsertSchema(userSessionExercises);
export const selectUserSessionExerciseSchema = createSelectSchema(userSessionExercises);
export type UserSessionExerciseRecord = typeof userSessionExercises.$inferSelect;
export type NewUserSessionExercise = typeof userSessionExercises.$inferInsert;
