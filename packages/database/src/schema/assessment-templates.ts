import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';

import { users } from './users';
import { templateQuestions } from './template-questions';
import type { ScoringConfig } from '../types';

/**
 * Assessment templates table definition
 *
 * Templates define assessment question structure.
 * Questions are linked via the template_questions join table (see template-questions.ts).
 *
 * No RLS - templates are system content accessible by all authenticated users.
 */
export const assessmentTemplates = pgTable(
  'assessment_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    version: integer('version').notNull().default(1),

    /**
     * @deprecated Use assessment_flows.scoringConfig instead.
     * Flow-level scoring provides holistic programme recommendations
     * across all templates in a flow. This column is nullable for
     * backwards compatibility and will be removed in a future migration.
     */
    scoringConfig: jsonb('scoring_config').$type<ScoringConfig>(),

    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_assessment_templates_active').on(table.isActive),
    index('idx_assessment_templates_name').on(table.name),
  ]
);

/**
 * Relations definition for assessment templates
 * - May have a creator (user who created the template)
 * - Has many template questions (via join table)
 */
export const assessmentTemplatesRelations = relations(assessmentTemplates, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [assessmentTemplates.createdBy],
    references: [users.id],
  }),
  templateQuestions: many(templateQuestions),
}));

export const insertAssessmentTemplateSchema = createInsertSchema(assessmentTemplates);

export const selectAssessmentTemplateSchema = createSelectSchema(assessmentTemplates);

export type AssessmentTemplateRecord = typeof assessmentTemplates.$inferSelect;

export type NewAssessmentTemplate = typeof assessmentTemplates.$inferInsert;
