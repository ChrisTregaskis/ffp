import { pgTable, uuid, jsonb, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { userAssessments } from './user-assessments';
import { questions } from './questions';
import type { AnswerValue } from '../types';

/**
 * User assessment answers table definition
 *
 * **Tenant Isolation Strategy:**
 * - `tenant_id` column enables RLS for multi-tenant isolation
 * - All queries must set RLS context via `SET app.tenant_id = {uuid}`
 * - RLS policy ensures users can only access answers within their tenant
 *
 * **Constraints:**
 * - UNIQUE(user_assessment_id, question_id): One answer per question per assessment
 * - FK CASCADE on assessment delete: Removes answers when assessment is deleted
 * - FK RESTRICT on question delete: Prevents deleting questions with answers
 *
 * **Indexes optimised for common queries:**
 * - tenant: For RLS policy enforcement
 * - assessment: Find all answers for an assessment
 * - assessment_question: Unique constraint index
 */
export const userAssessmentAnswers = pgTable(
  'user_assessment_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Tenant ID for RLS isolation - denormalised from user_assessment for policy efficiency */
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    /** Reference to the user assessment this answer belongs to */
    userAssessmentId: uuid('user_assessment_id')
      .notNull()
      .references(() => userAssessments.id, { onDelete: 'cascade' }),
    /** Reference to the question being answered */
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'restrict' }),
    /** The answer value - flexible JSONB to accommodate all question types */
    answerValue: jsonb('answer_value').$type<AnswerValue>().notNull(),
    /** When this answer was recorded/updated */
    answeredAt: timestamp('answered_at').defaultNow().notNull(),
  },
  (table) => [
    // One answer per question per assessment
    uniqueIndex('idx_user_assessment_answers_assessment_question').on(
      table.userAssessmentId,
      table.questionId
    ),
    // Efficient lookup for RLS policy
    index('idx_user_assessment_answers_tenant').on(table.tenantId),
    // Efficient lookup of all answers for an assessment
    index('idx_user_assessment_answers_assessment').on(table.userAssessmentId),
  ]
);

/**
 * Relations definition for user assessment answers
 * - Belongs to a tenant (for RLS isolation)
 * - Belongs to a user assessment
 * - References a question
 */
export const userAssessmentAnswersRelations = relations(userAssessmentAnswers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [userAssessmentAnswers.tenantId],
    references: [tenants.id],
  }),
  userAssessment: one(userAssessments, {
    fields: [userAssessmentAnswers.userAssessmentId],
    references: [userAssessments.id],
  }),
  question: one(questions, {
    fields: [userAssessmentAnswers.questionId],
    references: [questions.id],
  }),
}));

// Zod schema for inserting a user assessment answer
export const insertUserAssessmentAnswerSchema = createInsertSchema(userAssessmentAnswers);

// Zod schema for selecting a user assessment answer
export const selectUserAssessmentAnswerSchema = createSelectSchema(userAssessmentAnswers);

export type UserAssessmentAnswerRecord = typeof userAssessmentAnswers.$inferSelect;

export type NewUserAssessmentAnswer = typeof userAssessmentAnswers.$inferInsert;
