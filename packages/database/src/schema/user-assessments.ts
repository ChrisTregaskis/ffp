import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  integer,
  jsonb,
  timestamp,
  index,
  pgEnum,
  unique,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { USER_ASSESSMENT_STATUSES } from '../constants/user-assessment.constants';

import { assessmentFlows } from './assessment-flows';
import { organisations } from './organisations';
import { programmes } from './programmes';
import { userAssessmentAnswers } from './user-assessment-answers';
import { users } from './users';

import type { AssessmentWarning } from '../constants/branching.constants';
import type { UserAssessmentScores } from '../types/assessment.types';

export const userAssessmentStatusEnum = pgEnum('user_assessment_status', [
  ...USER_ASSESSMENT_STATUSES,
]);

/**
 * User assessments table definition
 *
 * **Organisation Isolation Strategy:**
 * - `organisation_id` column enables RLS for multi-tenant isolation
 * - All queries must set RLS context via `SET app.organisation_id = {uuid}`
 * - RLS policy ensures users can only access assessments within their organisation
 *
 * **Indexes optimised for common queries:**
 * - organisation_user: Find all assessments for a user within an organisation
 * - status: Filter by assessment status (e.g., find all in_progress)
 * - flow: Find all assessments for a specific flow
 */
export const userAssessments = pgTable(
  'user_assessments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    flowId: uuid('flow_id')
      .notNull()
      .references(() => assessmentFlows.id, { onDelete: 'restrict' }),
    /** Current step index in the flow (1-based) */
    currentStep: integer('current_step').notNull().default(1),
    /** Assessment state machine status */
    status: userAssessmentStatusEnum('status').notNull().default('not_started'),
    /** Calculated scores after scoring job completes (nullable until scored) */
    scores: jsonb('scores').$type<UserAssessmentScores | null>(),
    /**
     * Ordered list of step IDs the user has visited during this assessment.
     * Used for path tracking, branching validation, and resuming interrupted assessments.
     */
    visitedStepIds: jsonb('visited_step_ids').$type<string[]>().default([]),
    /**
     * Warnings shown to the user during the assessment (e.g., medical review warnings).
     * Stored for audit purposes and to prevent duplicate warnings on resume.
     */
    warningsShown: jsonb('warnings_shown').$type<AssessmentWarning[]>().default([]),
    /** Reference to generated programme (nullable until programme generation completes) */
    programmeId: uuid('programme_id'),
    /** When user started the assessment (null until status = in_progress) */
    startedAt: timestamp('started_at', { withTimezone: true }),
    /** When user submitted the assessment (null until status = submitted) */
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    /** When assessment flow completed (null until status = completed) */
    completedAt: timestamp('completed_at', { withTimezone: true }),
    /**
     * When the member confirmed they had acted on the safety advice their answers raised
     * (null until then, and always null when no safety warning fired)
     */
    safetyAcknowledgedAt: timestamp('safety_acknowledged_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_user_assessments_organisation_user').on(table.organisationId, table.userId),
    index('idx_user_assessments_status').on(table.status),
    index('idx_user_assessments_flow').on(table.flowId),
    unique('user_assessments_id_organisation_id_unique').on(table.id, table.organisationId),
    foreignKey({
      name: 'user_assessments_user_id_organisation_fk',
      columns: [table.userId, table.organisationId],
      foreignColumns: [users.id, users.organisationId],
    }).onDelete('cascade'),
    // The migration narrows this to SET NULL (programme_id): drizzle can't name the column,
    // and nulling organisation_id as well would break its NOT NULL
    foreignKey({
      name: 'user_assessments_programme_id_organisation_fk',
      columns: [table.programmeId, table.organisationId],
      foreignColumns: [programmes.id, programmes.organisationId],
    }).onDelete('set null'),
  ]
);

export const userAssessmentsRelations = relations(userAssessments, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [userAssessments.organisationId],
    references: [organisations.id],
  }),
  user: one(users, {
    fields: [userAssessments.userId],
    references: [users.id],
  }),
  flow: one(assessmentFlows, {
    fields: [userAssessments.flowId],
    references: [assessmentFlows.id],
  }),
  programme: one(programmes, {
    fields: [userAssessments.programmeId],
    references: [programmes.id],
  }),
  answers: many(userAssessmentAnswers),
}));

export const insertUserAssessmentSchema = createInsertSchema(userAssessments);
export const selectUserAssessmentSchema = createSelectSchema(userAssessments);
export type UserAssessmentRecord = typeof userAssessments.$inferSelect;
export type NewUserAssessment = typeof userAssessments.$inferInsert;
