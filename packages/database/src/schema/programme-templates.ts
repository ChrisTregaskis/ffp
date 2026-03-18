import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { difficultyEnum } from './videos';

/**
 * System-managed lookup table for programme templates. Referenced by:
 * - `programmes.programme_template_id` (FK) - which template generated this programme
 * - `assessment_flows.scoring_config.programmeMappings[].programmeTemplateId` (by slug in JSONB)
 */
export const programmeTemplates = pgTable(
  'programme_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Unique slug for referencing in scoring config (e.g., 'gentle-mobility-programme') */
    slug: varchar('slug', { length: 255 }).notNull(),
    /** Display name (e.g., 'Gentle Mobility Programme') */
    name: varchar('name', { length: 255 }).notNull(),
    /** Optional description of the programme template */
    description: text('description'),
    /** Whether this template is available for new programme generation */
    isActive: boolean('is_active').notNull().default(true),
    /** Total number of phases — auto-computed from actual phase count */
    totalPhases: integer('total_phases').notNull().default(0),
    /** Programme difficulty level (shared enum with videos) */
    difficulty: difficultyEnum('difficulty').notNull().default('beginner'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('idx_programme_templates_slug').on(table.slug)]
);

export const insertProgrammeTemplateSchema = createInsertSchema(programmeTemplates);
export const selectProgrammeTemplateSchema = createSelectSchema(programmeTemplates);
export type ProgrammeTemplateRecord = typeof programmeTemplates.$inferSelect;
export type NewProgrammeTemplate = typeof programmeTemplates.$inferInsert;
