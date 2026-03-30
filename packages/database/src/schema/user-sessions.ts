import { pgTable, uuid, integer, timestamp, uniqueIndex, index, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { SESSION_STATUSES } from '../constants/session.constants';
import { organisations } from './organisations';
import { programmePhases } from './programme-phases';
import { templateSessions } from './template-sessions';

export const sessionStatusEnum = pgEnum('session_status', [...SESSION_STATUSES]);

/**
 * User sessions table definition
 *
 * User-layer session instances created lazily when a user starts a session.
 * Each row tracks a user's progress through a specific session within a
 * programme phase, referencing both the user-layer phase and the template session.
 *
 * **RLS enforced** — organisation_id column with row-level security policies.
 */
export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Organisation for RLS isolation */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Parent programme phase (user-layer) */
    programmePhaseId: uuid('programme_phase_id')
      .notNull()
      .references(() => programmePhases.id, { onDelete: 'restrict' }),
    /** Source template session — restrict deletion of templates with active sessions */
    templateSessionId: uuid('template_session_id')
      .notNull()
      .references(() => templateSessions.id, { onDelete: 'restrict' }),
    /** Ordinal position within phase (copied from template, 1-based) */
    sessionNumber: integer('session_number').notNull(),
    /** Session lifecycle status */
    status: sessionStatusEnum('status').notNull().default('not_started'),
    /** When the session was paused (MVP pause tracking — full audit trail deferred to FFP-551) */
    pausedAt: timestamp('paused_at'),
    /** When the user started the session */
    startedAt: timestamp('started_at'),
    /** When the user completed the session */
    completedAt: timestamp('completed_at'),
    /** When the user skipped the session */
    skippedAt: timestamp('skipped_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_user_sessions_phase_session').on(table.programmePhaseId, table.sessionNumber),
    index('idx_user_sessions_organisation').on(table.organisationId),
    index('idx_user_sessions_programme_phase').on(table.programmePhaseId),
  ]
);

export const insertUserSessionSchema = createInsertSchema(userSessions);
export const selectUserSessionSchema = createSelectSchema(userSessions);
export type UserSessionRecord = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
