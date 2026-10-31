import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';

import { organisations } from './organisations';
import { userAssessments } from './user-assessments';
import { users } from './users';

/**
 * Assessment safety triggers table definition
 *
 * One row per submitted assessment whose answers fired a safety warning (the
 * member was advised to speak to a health professional before starting), so how
 * often that happens is a query. The member's consent is recorded on the
 * assessment itself (`user_assessments.safety_acknowledged_at`).
 *
 * **Organisation Isolation Strategy:**
 * - `organisation_id` column enables RLS for multi-tenant isolation
 * - All queries must set RLS context via `SET app.organisation_id = {uuid}`
 *
 * **Constraints:**
 * - UNIQUE(user_assessment_id): an assessment is counted once, however often it is submitted or read
 * - FK CASCADE on assessment delete: removes the trigger with its assessment
 */
export const assessmentSafetyTriggers = pgTable(
  'assessment_safety_triggers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    userAssessmentId: uuid('user_assessment_id').notNull(),
    userId: uuid('user_id').notNull(),
    /** Slug of the question whose answer fired the warning (null when no answer did, e.g. a score) */
    questionSlug: text('question_slug'),
    /** The options the member selected that the warning names (empty when no answer fired it) */
    selectedOptions: jsonb('selected_options').$type<string[]>().notNull(),
    /** The advice the member was shown */
    warningMessage: text('warning_message').notNull(),
    triggeredAt: timestamp('triggered_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_assessment_safety_triggers_assessment').on(table.userAssessmentId),
    index('idx_assessment_safety_triggers_organisation').on(table.organisationId),
    foreignKey({
      name: 'assessment_safety_triggers_user_assessment_id_organisation_fk',
      columns: [table.userAssessmentId, table.organisationId],
      foreignColumns: [userAssessments.id, userAssessments.organisationId],
    }).onDelete('cascade'),
    foreignKey({
      name: 'assessment_safety_triggers_user_id_organisation_fk',
      columns: [table.userId, table.organisationId],
      foreignColumns: [users.id, users.organisationId],
    }).onDelete('cascade'),
  ]
);

export const assessmentSafetyTriggersRelations = relations(assessmentSafetyTriggers, ({ one }) => ({
  organisation: one(organisations, {
    fields: [assessmentSafetyTriggers.organisationId],
    references: [organisations.id],
  }),
  userAssessment: one(userAssessments, {
    fields: [assessmentSafetyTriggers.userAssessmentId],
    references: [userAssessments.id],
  }),
  user: one(users, {
    fields: [assessmentSafetyTriggers.userId],
    references: [users.id],
  }),
}));

export type AssessmentSafetyTriggerRecord = typeof assessmentSafetyTriggers.$inferSelect;
export type NewAssessmentSafetyTrigger = typeof assessmentSafetyTriggers.$inferInsert;
