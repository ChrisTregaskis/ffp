import { pgTable, uuid, integer, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { assessmentTemplates } from './assessment-templates';
import { questions } from './questions';
import type { ConfigOverrides } from '../types';

/**
 * Template questions join table definition
 *
 * **Constraints:**
 * - UNIQUE(template_id, question_id): Each question can only appear once per template
 * - UNIQUE(template_id, display_order): Display order must be unique within a template
 * - FK CASCADE on template delete: Removes join records when template is deleted
 * - FK RESTRICT on question delete: Prevents deleting questions in use
 */
export const templateQuestions = pgTable(
  'template_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Reference to the assessment template */
    templateId: uuid('template_id')
      .notNull()
      .references(() => assessmentTemplates.id, { onDelete: 'cascade' }),
    /** Reference to the question */
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'restrict' }),
    /** Order in which question appears within the template (1-based) */
    displayOrder: integer('display_order').notNull(),
    /** Template-specific overrides for question text, description, or validation */
    configOverrides: jsonb('config_overrides').$type<ConfigOverrides>(),
  },
  (table) => [
    // Each question can only appear once per template
    uniqueIndex('idx_template_questions_template_question').on(table.templateId, table.questionId),
    // Display order must be unique within a template
    uniqueIndex('idx_template_questions_template_order').on(table.templateId, table.displayOrder),
    // Efficient lookup of all questions for a template
    index('idx_template_questions_template').on(table.templateId),
  ]
);

export const templateQuestionsRelations = relations(templateQuestions, ({ one }) => ({
  template: one(assessmentTemplates, {
    fields: [templateQuestions.templateId],
    references: [assessmentTemplates.id],
  }),
  question: one(questions, {
    fields: [templateQuestions.questionId],
    references: [questions.id],
  }),
}));

export const insertTemplateQuestionSchema = createInsertSchema(templateQuestions);
export const selectTemplateQuestionSchema = createSelectSchema(templateQuestions);
export type TemplateQuestionRecord = typeof templateQuestions.$inferSelect;
export type NewTemplateQuestion = typeof templateQuestions.$inferInsert;
