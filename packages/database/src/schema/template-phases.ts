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
import { programmeTemplates } from './programme-templates';

/**
 * Template phases table definition
 *
 * Defines the phase structure within a programme template. Each phase contains
 * 1–7 sessions and represents a training block (e.g., "Foundation Building").
 *
 * System-managed lookup table — no RLS required.
 * Physiotherapists can name consecutive phases the same to create visual groupings
 * in the UI without needing a separate grouping entity.
 */
export const templatePhases = pgTable(
  'template_phases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Parent programme template */
    programmeTemplateId: uuid('programme_template_id')
      .notNull()
      .references(() => programmeTemplates.id, { onDelete: 'cascade' }),
    /** Ordinal position within the template (1-based) */
    phaseNumber: integer('phase_number').notNull(),
    /** Optional display name (e.g., "Foundation Building") */
    name: varchar('name', { length: 255 }),
    /** Optional phase description */
    description: text('description'),
    /** Number of sessions in this phase (1–7) */
    sessionCount: integer('session_count').notNull().default(3),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_template_phases_template_phase').on(
      table.programmeTemplateId,
      table.phaseNumber
    ),
    index('idx_template_phases_template').on(table.programmeTemplateId),
  ]
);

export const insertTemplatePhaseSchema = createInsertSchema(templatePhases);
export const selectTemplatePhaseSchema = createSelectSchema(templatePhases);
export type TemplatePhaseRecord = typeof templatePhases.$inferSelect;
export type NewTemplatePhase = typeof templatePhases.$inferInsert;
