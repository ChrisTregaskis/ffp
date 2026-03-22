import { pgTable, uuid, text, integer, jsonb, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { organisations } from './organisations';
import { JOB_STATUSES, JOB_TYPES } from '../constants/job.constants';

export const jobStatusEnum = pgEnum('job_status', [...JOB_STATUSES]);
export const jobTypeEnum = pgEnum('job_type', [...JOB_TYPES]);

/**
 * Process jobs table definition
 *
 * **Organisation Isolation Strategy:**
 * - `organisation_id` column enables RLS for user-facing queries (e.g., "view my jobs")
 * - Job processor runs with BYPASSRLS to claim jobs across all organisations
 * - Each job handler sets organisation context for organisation-scoped operations within the job
 * - RLS policies to be added when user-facing job queries are implemented
 *
 * **Indexes optimised for job polling queries:**
 * - status: Filter queued jobs
 * - type + status: Route jobs to specific processors
 * - priority: Process higher priority jobs first (1=urgent, 2=high, 3=medium, 4=low)
 * - organisation_id: RLS filtering performance for user queries
 */
export const processJobs = pgTable(
  'process_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    type: jobTypeEnum('type').notNull(),
    status: jobStatusEnum('status').notNull().default('queued'),
    /** Job priority: 1=urgent, 2=high, 3=medium, 4=low (default) */
    priority: integer('priority').notNull().default(4),
    /** Job-specific payload data (structure depends on job type) */
    payload: jsonb('payload').notNull(),
    /** Job result (populated on successful completion) */
    result: jsonb('result'),
    /** Number of execution attempts (incremented on each retry) */
    attempts: integer('attempts').notNull().default(0),
    /** Maximum attempts before marking job as failed */
    maxAttempts: integer('max_attempts').notNull().default(3),
    /** Human-readable status message (e.g., progress info, failure reason) */
    message: text('message'),
    /** Earliest time this job can be retried (null = immediately available) */
    retryAfter: timestamp('retry_after'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    /** When a worker started processing this job */
    startedAt: timestamp('started_at'),
    /** When the job completed (success or final failure) */
    completedAt: timestamp('completed_at'),
  },
  (table) => [
    index('idx_process_jobs_status').on(table.status),
    index('idx_process_jobs_type_status').on(table.type, table.status),
    index('idx_process_jobs_priority').on(table.priority),
    index('idx_process_jobs_organisation').on(table.organisationId),
  ]
);

/**
 * Relations definition for process jobs
 * - Belongs to an organisation (for RLS isolation)
 */
export const processJobsRelations = relations(processJobs, ({ one }) => ({
  organisation: one(organisations, {
    fields: [processJobs.organisationId],
    references: [organisations.id],
  }),
}));

export const insertProcessJobSchema = createInsertSchema(processJobs);

export const selectProcessJobSchema = createSelectSchema(processJobs);

export type ProcessJobRecord = typeof processJobs.$inferSelect;

export type NewProcessJob = typeof processJobs.$inferInsert;
