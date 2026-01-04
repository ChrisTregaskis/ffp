import { pgTable, uuid, integer, jsonb, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './users';
import { assessmentFlows } from './assessment-flows';
import { userAssessmentAnswers } from './user-assessment-answers';
import { USER_ASSESSMENT_STATUSES } from '../constants/user-assessment.constants';

/**
 * User assessment status enumeration (PostgreSQL enum)
 *
 * Uses shared constants from @ffp/database/constants/user-assessment.constants.ts
 * View USER_ASSESSMENT_STATUSES for lifecycle details.
 */
export const userAssessmentStatusEnum = pgEnum('user_assessment_status', [
  ...USER_ASSESSMENT_STATUSES,
]);

/**
 * User assessments table definition
 *
 * **Tenant Isolation Strategy:**
 * - `tenant_id` column enables RLS for multi-tenant isolation
 * - All queries must set RLS context via `SET app.tenant_id = {uuid}`
 * - RLS policy ensures users can only access assessments within their tenant
 *
 * **Indexes optimised for common queries:**
 * - tenant_user: Find all assessments for a user within a tenant
 * - status: Filter by assessment status (e.g., find all in_progress)
 * - flow: Find all assessments for a specific flow
 */
export const userAssessments = pgTable(
  'user_assessments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    flowId: uuid('flow_id')
      .notNull()
      .references(() => assessmentFlows.id, { onDelete: 'restrict' }),
    /** Current step index in the flow (1-based) */
    currentStep: integer('current_step').notNull().default(1),
    /** Assessment state machine status */
    status: userAssessmentStatusEnum('status').notNull().default('not_started'),
    /** Calculated scores after scoring job completes (nullable until scored) */
    scores: jsonb('scores'),
    /**
     * Reference to generated programme (nullable until programme generation)
     * FK constraint will be added when programmes table is created (FFP-134)
     */
    programmeId: uuid('programme_id'),
    /** When user started the assessment (null until status = in_progress) */
    startedAt: timestamp('started_at'),
    /** When user submitted the assessment (null until status = submitted) */
    submittedAt: timestamp('submitted_at'),
    /** When assessment flow completed (null until status = completed) */
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_user_assessments_tenant_user').on(table.tenantId, table.userId),
    index('idx_user_assessments_status').on(table.status),
    index('idx_user_assessments_flow').on(table.flowId),
  ]
);

/**
 * Relations definition for user assessments
 * - Belongs to a tenant (for RLS isolation)
 * - Belongs to a user
 * - References an assessment flow
 * - Has many answers (via user_assessment_answers table)
 */
export const userAssessmentsRelations = relations(userAssessments, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [userAssessments.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [userAssessments.userId],
    references: [users.id],
  }),
  flow: one(assessmentFlows, {
    fields: [userAssessments.flowId],
    references: [assessmentFlows.id],
  }),
  answers: many(userAssessmentAnswers),
}));

export const insertUserAssessmentSchema = createInsertSchema(userAssessments);

export const selectUserAssessmentSchema = createSelectSchema(userAssessments);

export type UserAssessmentRecord = typeof userAssessments.$inferSelect;

export type NewUserAssessment = typeof userAssessments.$inferInsert;
