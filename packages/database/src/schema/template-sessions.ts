import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { templatePhases } from './template-phases';
import { publicIdColumn, publicIdIndex } from '../lib/public-id';

/**
 * Template sessions table definition
 *
 * Defines sessions within a phase template. Each session is an ordered workout
 * that the user completes at their own pace (sequential, not calendar-bound).
 *
 * System-managed lookup table — no RLS required.
 */
export const templateSessions = pgTable(
  'template_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publicId: publicIdColumn(),
    /** Parent template phase */
    templatePhaseId: uuid('template_phase_id')
      .notNull()
      .references(() => templatePhases.id, { onDelete: 'cascade' }),
    /** Ordinal position within the phase (1-based) */
    sessionNumber: integer('session_number').notNull(),
    /** Optional display name (e.g., "Lower Body Focus") */
    name: varchar('name', { length: 255 }),
    /** Optional session description */
    description: text('description'),
    /** Approximate session length in minutes */
    estimatedDurationMinutes: integer('estimated_duration_minutes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    publicIdIndex('template_sessions', table.publicId),
    uniqueIndex('idx_template_sessions_phase_session').on(
      table.templatePhaseId,
      table.sessionNumber
    ),
    index('idx_template_sessions_phase').on(table.templatePhaseId),
  ]
);

export const insertTemplateSessionSchema = createInsertSchema(templateSessions);
export const selectTemplateSessionSchema = createSelectSchema(templateSessions);
export type TemplateSessionRecord = typeof templateSessions.$inferSelect;
export type NewTemplateSession = typeof templateSessions.$inferInsert;
