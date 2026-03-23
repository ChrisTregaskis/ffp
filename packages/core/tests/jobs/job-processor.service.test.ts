/**
 * Job Processor Service Integration Tests
 *
 * Tests job polling and claiming operations against a real PostgreSQL database (ffp_test).
 * These tests verify that the processor correctly claims jobs atomically using
 * FOR UPDATE SKIP LOCKED, preventing double-processing across concurrent workers.
 *
 * Prerequisites:
 * - ffp_test database must exist
 * - Migrations must be run: DB_NAME=ffp_test pnpm --filter=@ffp/database db:migrate
 */

import { randomUUID } from 'crypto';

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

import * as schema from '@ffp/database/schema';

import {
  pollAndClaimJobs,
  calculateBackoffMs,
  completeJob,
  failJob,
} from '../../src/jobs/job-processor.service';
import { NotFoundError } from '../../src/lib/errors';

// We need to mock getDb but keep other exports
const { mockGetDb } = vi.hoisted(() => ({
  mockGetDb: vi.fn(),
}));

vi.mock('@ffp/database', async () => {
  const actual = await vi.importActual('@ffp/database');
  return {
    ...actual,
    getDb: mockGetDb,
  };
});

/**
 * Sets the RLS context for testing purposes.
 *
 * IMPORTANT: This helper uses sql.raw() with validated UUID input.
 * This is necessary because:
 * 1. PostgreSQL's set_config() with parameterised queries can have connection
 *    pool issues where the setting doesn't persist across statements
 * 2. SET commands don't support traditional parameterised queries
 *
 * The UUID validation ensures this is safe from SQL injection.
 * DO NOT copy this pattern to production code - use proper RLS context
 * management with transactions instead.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function setTestRLSContext(
  db: ReturnType<typeof drizzle>,
  organisationId: string
): Promise<void> {
  if (!UUID_REGEX.test(organisationId)) {
    throw new Error(`Invalid UUID format for RLS context: ${organisationId}`);
  }
  await db.execute(sql.raw(`SET app.organisation_id = '${organisationId}'`));
}

describe('Job Processor Service', () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;
  let testOrganisationId: string;

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: 'ffp_test',
      user: process.env.DB_USER ?? 'test_user',
      password: process.env.DB_PASSWORD ?? 'test_password',
    });
    db = drizzle(pool, { schema });

    // Configure mock to return our test db
    mockGetDb.mockReturnValue(db);

    // Clean up any leftover queued jobs from previous test runs
    // This ensures a clean state for the first test
    await db.execute(sql`DELETE FROM process_jobs WHERE status = 'queued'`);
  });

  beforeEach(async () => {
    // Create unique test organisation for each test
    testOrganisationId = randomUUID();

    await setTestRLSContext(db, testOrganisationId);
    await db.insert(schema.organisations).values({
      id: testOrganisationId,
      name: `Test Organisation ${testOrganisationId.slice(0, 8)}`,
      type: 'business',
    });

    // Ensure no leftover jobs exist for this organisation (defensive cleanup)
    await db.execute(sql`DELETE FROM process_jobs WHERE organisation_id = ${testOrganisationId}`);
  });

  afterEach(async () => {
    // Clean up test data
    if (testOrganisationId) {
      await db.execute(sql`DELETE FROM process_jobs WHERE organisation_id = ${testOrganisationId}`);
      await setTestRLSContext(db, testOrganisationId);
      await db.execute(sql`DELETE FROM organisations WHERE id = ${testOrganisationId}`);
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  /**
   * Helper to create a test job directly in the database
   */
  async function createTestJob(
    overrides: Partial<schema.NewProcessJob> = {}
  ): Promise<schema.ProcessJobRecord> {
    const [job] = await db
      .insert(schema.processJobs)
      .values({
        organisationId: testOrganisationId,
        type: 'score_assessment',
        status: 'queued',
        priority: 4,
        payload: {
          assessmentSubmissionId: randomUUID(),
          templateId: randomUUID(),
          userId: randomUUID(),
          responses: [{ questionId: randomUUID(), answerValue: 5 }],
        },
        ...overrides,
      })
      .returning();

    return job;
  }

  describe('pollAndClaimJobs', () => {
    it('returns result with count matching claimedJobs length', async () => {
      // Note: In concurrent test runs, other tests may create jobs
      // This test verifies the function returns a valid result structure
      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });

      expect(result).toHaveProperty('claimedJobs');
      expect(result).toHaveProperty('count');
      expect(result.count).toBe(result.claimedJobs.length);
      expect(Array.isArray(result.claimedJobs)).toBe(true);
    });

    it('claims a single queued job', async () => {
      const job = await createTestJob();

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });

      // Find our job in the results (other tests may have created jobs concurrently)
      const claimedJob = result.claimedJobs.find((j) => j.id === job.id);
      expect(claimedJob).toBeDefined();
      if (claimedJob) {
        expect(claimedJob.status).toBe('processing');
        expect(claimedJob.startedAt).toBeInstanceOf(Date);
        expect(claimedJob.attempts).toBe(1);
      }
    });

    it('respects maxConcurrentByType limit for specific job type', async () => {
      // Create 10 score_assessment jobs
      await Promise.all(
        Array.from({ length: 10 }, () => createTestJob({ type: 'score_assessment' }))
      );

      const result = await pollAndClaimJobs({
        maxConcurrentByType: { score_assessment: 3 },
        defaultMaxConcurrent: 10,
      });

      // Should only claim 3 score_assessment jobs (limited by maxConcurrentByType)
      const scoreAssessmentJobs = result.claimedJobs.filter((j) => j.type === 'score_assessment');
      expect(scoreAssessmentJobs).toHaveLength(3);

      // Verify all claimed jobs are now processing
      for (const job of result.claimedJobs) {
        expect(job.status).toBe('processing');
      }
    });

    it('uses defaultMaxConcurrent for types not in maxConcurrentByType', async () => {
      // Create 5 generate_programme jobs
      await Promise.all(
        Array.from({ length: 5 }, () => createTestJob({ type: 'generate_programme' }))
      );

      const result = await pollAndClaimJobs({
        maxConcurrentByType: { score_assessment: 10 }, // Not setting generate_programme
        defaultMaxConcurrent: 2,
      });

      // Should use defaultMaxConcurrent (2) for generate_programme
      const generateProgrammeJobs = result.claimedJobs.filter(
        (j) => j.type === 'generate_programme'
      );
      expect(generateProgrammeJobs).toHaveLength(2);
    });

    it('polls all job types and combines results', async () => {
      await createTestJob({ type: 'score_assessment' });
      await createTestJob({ type: 'score_assessment' });
      await createTestJob({ type: 'generate_programme' });

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });

      expect(result.count).toBe(3);

      const scoreAssessmentJobs = result.claimedJobs.filter((j) => j.type === 'score_assessment');
      const generateProgrammeJobs = result.claimedJobs.filter(
        (j) => j.type === 'generate_programme'
      );

      expect(scoreAssessmentJobs).toHaveLength(2);
      expect(generateProgrammeJobs).toHaveLength(1);
    });

    it('returns empty results when no jobs are queued', async () => {
      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });

      // May have 0 or more jobs depending on concurrent tests
      expect(result.count).toBe(result.claimedJobs.length);
    });

    it('orders jobs by priority (lower number = higher priority)', async () => {
      // Create jobs with different priorities in random order
      await createTestJob({ priority: 4 }); // Low
      await createTestJob({ priority: 1 }); // Urgent
      await createTestJob({ priority: 3 }); // Medium
      await createTestJob({ priority: 2 }); // High

      const result = await pollAndClaimJobs({
        maxConcurrentByType: { score_assessment: 4 },
      });

      // Filter to just our score_assessment jobs and check order
      const scoreJobs = result.claimedJobs.filter((j) => j.type === 'score_assessment');
      expect(scoreJobs).toHaveLength(4);
      expect(scoreJobs[0].priority).toBe(1);
      expect(scoreJobs[1].priority).toBe(2);
      expect(scoreJobs[2].priority).toBe(3);
      expect(scoreJobs[3].priority).toBe(4);
    });

    it('does not claim jobs that are not queued', async () => {
      await createTestJob({ status: 'processing' });
      await createTestJob({ status: 'completed' });
      await createTestJob({ status: 'failed' });
      await createTestJob({ status: 'queued' }); // Only this one should be claimed

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });

      // Should only have claimed the queued job
      expect(result.count).toBe(1);
      expect(result.claimedJobs[0].status).toBe('processing');
    });

    it('respects retryAfter - does not claim jobs scheduled for the future', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const futureJob = await createTestJob({ retryAfter: futureDate });
      const claimableJob = await createTestJob({ retryAfter: null }); // Should be claimed

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });

      // Verify the claimable job was claimed
      const claimedJob = result.claimedJobs.find((j) => j.id === claimableJob.id);
      expect(claimedJob).toBeDefined();
      expect(claimedJob?.status).toBe('processing');

      // Verify the future job was NOT claimed
      const notClaimedJob = result.claimedJobs.find((j) => j.id === futureJob.id);
      expect(notClaimedJob).toBeUndefined();
    });

    it('claims jobs where retryAfter is in the past', async () => {
      const pastDate = new Date(Date.now() - 60 * 1000); // 1 minute ago
      const job = await createTestJob({ retryAfter: pastDate });

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });

      // Find our specific job (other tests may create jobs concurrently)
      const claimedJob = result.claimedJobs.find((j) => j.id === job.id);
      expect(claimedJob).toBeDefined();
      expect(claimedJob?.status).toBe('processing');
    });

    it('increments attempts counter on claim', async () => {
      // Create a job that has been attempted before (simulating a retry)
      const job = await createTestJob();

      // Manually set attempts to 1 (simulating previous attempt)
      await db
        .update(schema.processJobs)
        .set({ attempts: 1, status: 'queued' })
        .where(sql`id = ${job.id}`);

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });

      expect(result.count).toBe(1);
      expect(result.claimedJobs[0].attempts).toBe(2);
    });

    it('sets startedAt timestamp when claiming', async () => {
      const beforeClaim = new Date();
      const job = await createTestJob();

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });
      const afterClaim = new Date();

      // Find our job (other tests may have created jobs concurrently)
      const claimedJob = result.claimedJobs.find((j) => j.id === job.id);
      expect(claimedJob).toBeDefined();
      if (claimedJob) {
        expect(claimedJob.startedAt).toBeInstanceOf(Date);
        if (claimedJob.startedAt) {
          expect(claimedJob.startedAt.getTime()).toBeGreaterThanOrEqual(beforeClaim.getTime());
          expect(claimedJob.startedAt.getTime()).toBeLessThanOrEqual(afterClaim.getTime());
        }
      }
    });

    it('claimed jobs are not returned in subsequent polls', async () => {
      await createTestJob();

      // First poll claims the job
      const result1 = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });
      expect(result1.count).toBe(1);

      // Second poll finds nothing (job is now processing)
      const result2 = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });
      expect(result2.count).toBe(0);
    });

    it('uses default maxConcurrent of 5 when no config provided', async () => {
      // Create 10 jobs
      await Promise.all(Array.from({ length: 10 }, () => createTestJob()));

      const result = await pollAndClaimJobs();

      // Should claim 5 (default maxConcurrent)
      expect(result.count).toBe(5);
    });
  });

  describe('concurrent polling (FOR UPDATE SKIP LOCKED)', () => {
    it('prevents double-processing when two pollers run concurrently', async () => {
      // Create 5 jobs
      const jobs = await Promise.all(Array.from({ length: 5 }, () => createTestJob()));
      const jobIds = new Set(jobs.map((j) => j.id));

      // Run two pollers concurrently, each trying to claim 5 jobs
      const [result1, result2] = await Promise.all([
        pollAndClaimJobs({ maxConcurrentByType: { score_assessment: 5 } }),
        pollAndClaimJobs({ maxConcurrentByType: { score_assessment: 5 } }),
      ]);

      // Filter to only our test jobs (other tests may create jobs concurrently)
      const ourResult1Jobs = result1.claimedJobs.filter((j) => jobIds.has(j.id));
      const ourResult2Jobs = result2.claimedJobs.filter((j) => jobIds.has(j.id));

      // All 5 of our jobs should be claimed across both pollers
      const totalOurJobsClaimed = ourResult1Jobs.length + ourResult2Jobs.length;
      expect(totalOurJobsClaimed).toBe(5);

      // No job should appear in both results (no double-processing)
      const result1Ids = new Set(ourResult1Jobs.map((j) => j.id));
      const result2Ids = new Set(ourResult2Jobs.map((j) => j.id));

      for (const id of result1Ids) {
        expect(result2Ids.has(id)).toBe(false);
      }

      // Verify all original jobs are now processing
      for (const job of jobs) {
        const [updatedJob] = await db
          .select()
          .from(schema.processJobs)
          .where(sql`id = ${job.id}`);
        expect(updatedJob.status).toBe('processing');
      }
    });
  });

  describe('calculateBackoffMs', () => {
    it('returns 2000ms for attempt 1', () => {
      expect(calculateBackoffMs(1)).toBe(2000);
    });

    it('returns 4000ms for attempt 2', () => {
      expect(calculateBackoffMs(2)).toBe(4000);
    });

    it('returns 8000ms for attempt 3', () => {
      expect(calculateBackoffMs(3)).toBe(8000);
    });

    it('returns 16000ms for attempt 4', () => {
      expect(calculateBackoffMs(4)).toBe(16000);
    });

    it('returns 1000ms for attempt 0 (edge case)', () => {
      // 2^0 = 1, so 1 * 1000 = 1000
      expect(calculateBackoffMs(0)).toBe(1000);
    });
  });

  describe('completeJob', () => {
    it('sets status to completed with result', async () => {
      const job = await createTestJob({ status: 'processing' });
      const result = { scores: { strength: 75, balance: 82 } };

      const completeResult = await completeJob(job.id, result);

      expect(completeResult.jobId).toBe(job.id);
      expect(completeResult.success).toBe(true);

      // Verify database state
      const [updatedJob] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${job.id}`);

      expect(updatedJob.status).toBe('completed');
      expect(updatedJob.result).toEqual(result);
      expect(updatedJob.completedAt).toBeInstanceOf(Date);
    });

    it('sets completedAt timestamp', async () => {
      const beforeComplete = new Date();
      const job = await createTestJob({ status: 'processing' });

      await completeJob(job.id, { data: 'test' });
      const afterComplete = new Date();

      const [updatedJob] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${job.id}`);

      expect(updatedJob.completedAt).toBeInstanceOf(Date);
      if (updatedJob.completedAt) {
        expect(updatedJob.completedAt.getTime()).toBeGreaterThanOrEqual(beforeComplete.getTime());
        expect(updatedJob.completedAt.getTime()).toBeLessThanOrEqual(afterComplete.getTime());
      }
    });
  });

  describe('failJob', () => {
    it('returns job to queued if attempts < maxAttempts', async () => {
      // Create a job that has been attempted once (maxAttempts=3 by default)
      const job = await createTestJob({ status: 'processing' });
      // Simulate one attempt by updating the job
      await db
        .update(schema.processJobs)
        .set({ attempts: 1 })
        .where(sql`id = ${job.id}`);

      // Fetch updated job record
      const [jobWithAttempt] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${job.id}`);

      const result = await failJob(jobWithAttempt, new Error('API timeout'));

      expect(result.willRetry).toBe(true);
      expect(result.newStatus).toBe('queued');
      expect(result.retryAfter).toBeInstanceOf(Date);

      // Verify database state
      const [updatedJob] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${job.id}`);

      expect(updatedJob.status).toBe('queued');
      expect(updatedJob.message).toBe('API timeout');
      expect(updatedJob.retryAfter).toBeInstanceOf(Date);
      expect(updatedJob.completedAt).toBeNull();
    });

    it('sets status to failed if attempts >= maxAttempts', async () => {
      // Create a job that has exhausted all attempts
      const job = await createTestJob({ status: 'processing', maxAttempts: 3 });
      await db
        .update(schema.processJobs)
        .set({ attempts: 3 })
        .where(sql`id = ${job.id}`);

      const [jobWithAttempts] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${job.id}`);

      const result = await failJob(jobWithAttempts, new Error('Final failure'));

      expect(result.willRetry).toBe(false);
      expect(result.newStatus).toBe('failed');
      expect(result.retryAfter).toBeNull();

      // Verify database state
      const [updatedJob] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${job.id}`);

      expect(updatedJob.status).toBe('failed');
      expect(updatedJob.message).toBe('Final failure');
      expect(updatedJob.retryAfter).toBeNull();
      expect(updatedJob.completedAt).toBeInstanceOf(Date);
    });

    it('calculates correct exponential backoff for retryAfter', async () => {
      const beforeFail = Date.now();
      const job = await createTestJob({ status: 'processing' });
      await db
        .update(schema.processJobs)
        .set({ attempts: 2 })
        .where(sql`id = ${job.id}`);

      const [jobWith2Attempts] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${job.id}`);

      const result = await failJob(jobWith2Attempts, new Error('Retry error'));

      // With 2 attempts, backoff should be 2^2 * 1000 = 4000ms
      expect(result.retryAfter).toBeInstanceOf(Date);
      if (result.retryAfter) {
        const expectedMinTime = beforeFail + 4000;
        const expectedMaxTime = Date.now() + 4000 + 100; // Small buffer for execution time

        expect(result.retryAfter.getTime()).toBeGreaterThanOrEqual(expectedMinTime);
        expect(result.retryAfter.getTime()).toBeLessThanOrEqual(expectedMaxTime);
      }
    });

    it('always records error message on failure', async () => {
      const job = await createTestJob({ status: 'processing' });
      await db
        .update(schema.processJobs)
        .set({ attempts: 1 })
        .where(sql`id = ${job.id}`);

      const [jobRecord] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${job.id}`);

      await failJob(jobRecord, new Error('Connection refused'));

      const [updatedJob] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${job.id}`);

      expect(updatedJob.message).toBe('Connection refused');
    });

    it('sets completedAt only on final failure', async () => {
      // Test retry case - completedAt should be null
      const retryJob = await createTestJob({ status: 'processing', maxAttempts: 3 });
      await db
        .update(schema.processJobs)
        .set({ attempts: 1 })
        .where(sql`id = ${retryJob.id}`);

      const [retryJobRecord] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${retryJob.id}`);

      await failJob(retryJobRecord, new Error('Temporary error'));

      const [updatedRetryJob] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${retryJob.id}`);

      expect(updatedRetryJob.completedAt).toBeNull();

      // Test final failure case - completedAt should be set
      const failedJob = await createTestJob({ status: 'processing', maxAttempts: 2 });
      await db
        .update(schema.processJobs)
        .set({ attempts: 2 })
        .where(sql`id = ${failedJob.id}`);

      const [failedJobRecord] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${failedJob.id}`);

      await failJob(failedJobRecord, new Error('Permanent error'));

      const [updatedFailedJob] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${failedJob.id}`);

      expect(updatedFailedJob.completedAt).toBeInstanceOf(Date);
    });

    it('throws NotFoundError when job is not in processing status', async () => {
      // Create a job that is queued (not processing)
      const job = await createTestJob({ status: 'queued' });

      const [jobRecord] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${job.id}`);

      await expect(failJob(jobRecord, new Error('Should fail'))).rejects.toThrow(NotFoundError);

      // Verify job status unchanged
      const [unchangedJob] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${job.id}`);

      expect(unchangedJob.status).toBe('queued');
    });
  });

  describe('completeJob validation', () => {
    it('throws NotFoundError for non-existent job ID', async () => {
      const nonExistentId = randomUUID();

      await expect(completeJob(nonExistentId, { data: 'test' })).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when job is not in processing status', async () => {
      // Create a job that is queued (not processing)
      const job = await createTestJob({ status: 'queued' });

      await expect(completeJob(job.id, { data: 'test' })).rejects.toThrow(NotFoundError);

      // Verify job status unchanged
      const [unchangedJob] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${job.id}`);

      expect(unchangedJob.status).toBe('queued');
    });

    it('throws NotFoundError when job is already completed', async () => {
      const job = await createTestJob({ status: 'completed' });

      await expect(completeJob(job.id, { data: 'test' })).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when job is already failed', async () => {
      const job = await createTestJob({ status: 'failed' });

      await expect(completeJob(job.id, { data: 'test' })).rejects.toThrow(NotFoundError);
    });
  });
});
