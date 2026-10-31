import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

import { publicIdColumn, publicIdIndex } from '../lib/public-id';

import { templateQuestions } from './template-questions';
import { users } from './users';

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
    publicId: publicIdColumn(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    version: integer('version').notNull().default(1),

    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    publicIdIndex('assessment_templates', table.publicId),
    index('idx_assessment_templates_active').on(table.isActive),
    index('idx_assessment_templates_name').on(table.name),
  ]
);

export const assessmentTemplatesRelations = relations(assessmentTemplates, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [assessmentTemplates.createdBy],
    references: [users.id],
  }),
  templateQuestions: many(templateQuestions),
}));

export type AssessmentTemplateRecord = typeof assessmentTemplates.$inferSelect;
export type NewAssessmentTemplate = typeof assessmentTemplates.$inferInsert;
