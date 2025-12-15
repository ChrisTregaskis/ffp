import { pgTable, uuid, text, integer, jsonb, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';

/**
 * Job status enumeration (PostgreSQL enum)
 *
 * IMPORTANT: Keep in sync with jobStatusSchema in @ffp/core/src/schemas/job.schema.ts
 * Manual synchronisation required (cannot auto-generate due to circular dependency).
 *
 * Status lifecycle:
 * - pending: Job created, waiting to be picked up by worker
 * - processing: Worker has claimed the job, currently executing
 * - completed: Job finished successfully, result populated
 * - failed: Job failed after max retries, lastError populated
 * - cancelled: Job was manually cancelled before completion
 */
export const jobStatusEnum = pgEnum('job_status', [
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

/**
 * Job type enumeration (PostgreSQL enum)
 *
 * IMPORTANT: Keep in sync with jobTypeSchema in @ffp/core/src/schemas/job.schema.ts
 * Manual synchronisation required (cannot auto-generate due to circular dependency).
 *
 * Job types for MVP:
 * - score_assessment: Calculate dimensional scores from assessment responses
 * - generate_program: Generate personalised workout programme from scores
 */
export const jobTypeEnum = pgEnum('job_type', ['score_assessment', 'generate_program']);

/**
 * Process jobs table definition
 * RLS enabled to enforce tenant isolation (see migrations)
 *
 * Indexes optimised for job polling queries:
 * - status: Filter pending jobs
 * - type + status: Route jobs to specific processors
 * - priority: Process higher priority jobs first (1=urgent, 2=high, 3=medium, 4=low)
 * - tenant_id: RLS filtering performance
 */
export const processJobs = pgTable(
  'process_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
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
    /** Error message from the last failed attempt */
    lastError: text('last_error'),
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
    index('idx_process_jobs_tenant').on(table.tenantId),
  ]
);

/**
 * Relations definition for process jobs
 * - Belongs to a tenant (for RLS isolation)
 */
export const processJobsRelations = relations(processJobs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [processJobs.tenantId],
    references: [tenants.id],
  }),
}));

export const insertProcessJobSchema = createInsertSchema(processJobs);

export const selectProcessJobSchema = createSelectSchema(processJobs);

export type ProcessJobRecord = typeof processJobs.$inferSelect;

export type NewProcessJob = typeof processJobs.$inferInsert;
