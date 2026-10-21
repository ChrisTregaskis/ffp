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

import { eq, inArray, sql } from 'drizzle-orm';
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
import { drizzleDriverError, expectNothingLeakable } from '../lib/database-error.fixture';
import { asOrganisation, deleteOrganisations } from '../lib/rls-context.fixture';

import { jobPayload } from './job-payload.fixture';

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

describe('Job Processor Service', () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;
  let testOrganisationId: string;

  beforeAll(() => {
    pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER ?? 'test_user',
      password: process.env.DB_PASSWORD ?? 'test_password',
    });
    db = drizzle(pool, { schema });

    // Configure mock to return our test db
    mockGetDb.mockReturnValue(db);
  });

  beforeEach(async () => {
    // The poll claims across every organisation, so another run's queued jobs would
    // take the limit and be flipped to processing; refuse to start rather than do that
    const queued = await db.execute(
      sql`SELECT count(*)::int AS queued_elsewhere FROM process_jobs WHERE status = 'queued'`
    );
    expect(queued.rows, 'queued jobs this suite did not create').toEqual([{ queued_elsewhere: 0 }]);

    // Create unique test organisation for each test
    testOrganisationId = randomUUID();

    await asOrganisation(db, testOrganisationId, async (tx) => {
      await tx.insert(schema.organisations).values({
        id: testOrganisationId,
        name: `Test Organisation ${testOrganisationId.slice(0, 8)}`,
        type: 'business',
      });
    });
  });

  afterEach(async () => {
    // The organisation's jobs go with it (ON DELETE CASCADE)
    await deleteOrganisations(db, [testOrganisationId]);
  });

  afterAll(async () => {
    await pool.end();
  });

  /**
   * The poll claims across every organisation (process_jobs has no RLS), so each
   * test judges only the jobs it queued under its own organisation.
   */
  const ownJobs = (jobs: schema.ProcessJobRecord[]): schema.ProcessJobRecord[] =>
    jobs.filter((job) => job.organisationId === testOrganisationId);

  /**
   * Helper to create a test job directly in the database
   */
  async function createTestJob(
    overrides: Partial<schema.NewProcessJob> = {}
  ): Promise<schema.ProcessJobRecord> {
    const type = overrides.type ?? 'score_assessment';
    const payload = jobPayload(type);

    const [job] = await db
      .insert(schema.processJobs)
      .values({
        organisationId: testOrganisationId,
        type,
        status: 'queued',
        priority: 4,
        payload,
        ...overrides,
      })
      .returning();

    return job;
  }

  describe('pollAndClaimJobs', () => {
    it('claims a single queued job', async () => {
      const job = await createTestJob();

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });

      const claimed = ownJobs(result.claimedJobs);
      expect(claimed.map((claimedJob) => claimedJob.id)).toEqual([job.id]);
      const [claimedJob] = claimed;
      expect(claimedJob.status).toBe('processing');
      expect(claimedJob.startedAt).toBeInstanceOf(Date);
      expect(claimedJob.attempts).toBe(1);
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
      const scoreAssessmentJobs = ownJobs(result.claimedJobs).filter(
        (j) => j.type === 'score_assessment'
      );
      expect(scoreAssessmentJobs.map((job) => job.status)).toEqual([
        'processing',
        'processing',
        'processing',
      ]);
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
      const generateProgrammeJobs = ownJobs(result.claimedJobs).filter(
        (j) => j.type === 'generate_programme'
      );
      expect(generateProgrammeJobs).toHaveLength(2);
    });

    it('polls all job types and combines results', async () => {
      await createTestJob({ type: 'score_assessment' });
      await createTestJob({ type: 'score_assessment' });
      await createTestJob({ type: 'generate_programme' });

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });
      const claimed = ownJobs(result.claimedJobs);

      expect(result.count).toBe(result.claimedJobs.length);
      expect(claimed).toHaveLength(3);

      const scoreAssessmentJobs = claimed.filter((j) => j.type === 'score_assessment');
      const generateProgrammeJobs = claimed.filter((j) => j.type === 'generate_programme');

      expect(scoreAssessmentJobs).toHaveLength(2);
      expect(generateProgrammeJobs).toHaveLength(1);
    });

    it('claims the highest-priority jobs first when more are queued than the limit', async () => {
      // Lower number = higher priority; created out of order, so creation time can't explain the result
      const low = await createTestJob({ priority: 4 });
      const urgent = await createTestJob({ priority: 1 });
      const medium = await createTestJob({ priority: 3 });
      const high = await createTestJob({ priority: 2 });

      const result = await pollAndClaimJobs({
        maxConcurrentByType: { score_assessment: 2 },
      });

      expect(ownJobs(result.claimedJobs).map((job) => job.id)).toEqual([urgent.id, high.id]);

      const leftBehind = await db
        .select()
        .from(schema.processJobs)
        .where(inArray(schema.processJobs.id, [low.id, medium.id]));
      expect(leftBehind.map((job) => job.status)).toEqual(['queued', 'queued']);
    });

    it('does not claim jobs that are not queued', async () => {
      await createTestJob({ status: 'processing' });
      await createTestJob({ status: 'completed' });
      await createTestJob({ status: 'failed' });
      const queued = await createTestJob({ status: 'queued' }); // Only this one should be claimed

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });

      // Should only have claimed the queued job
      const claimed = ownJobs(result.claimedJobs);
      expect(claimed.map((job) => job.id)).toEqual([queued.id]);
      expect(claimed[0].status).toBe('processing');
    });

    it('respects retryAfter - does not claim jobs scheduled for the future', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const futureJob = await createTestJob({ retryAfter: futureDate });
      const claimableJob = await createTestJob({ retryAfter: null }); // Should be claimed

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });

      // Only the claimable job was claimed; the future one is left queued
      const claimed = ownJobs(result.claimedJobs);
      expect(claimed.map((job) => job.id)).toEqual([claimableJob.id]);
      expect(claimed[0].status).toBe('processing');
      const [futureJobNow] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${futureJob.id}`);
      expect(futureJobNow.status).toBe('queued');
    });

    it('claims jobs where retryAfter is in the past', async () => {
      const pastDate = new Date(Date.now() - 60 * 1000); // 1 minute ago
      const job = await createTestJob({ retryAfter: pastDate });

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });

      const claimed = ownJobs(result.claimedJobs);
      expect(claimed.map((claimedJob) => claimedJob.id)).toEqual([job.id]);
      expect(claimed[0].status).toBe('processing');
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
      const claimed = ownJobs(result.claimedJobs);

      expect(claimed).toHaveLength(1);
      expect(claimed[0].attempts).toBe(2);
    });

    it('sets startedAt timestamp when claiming', async () => {
      const beforeClaim = new Date();
      const job = await createTestJob();

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });
      const afterClaim = new Date();

      const claimed = ownJobs(result.claimedJobs);
      expect(claimed.map((claimedJob) => claimedJob.id)).toEqual([job.id]);
      const [claimedJob] = claimed;
      expect(claimedJob.startedAt).toBeInstanceOf(Date);
      expect(claimedJob.startedAt?.getTime()).toBeGreaterThanOrEqual(beforeClaim.getTime());
      expect(claimedJob.startedAt?.getTime()).toBeLessThanOrEqual(afterClaim.getTime());
    });

    it('claimed jobs are not returned in subsequent polls', async () => {
      await createTestJob();

      // First poll claims the job
      const result1 = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });
      expect(ownJobs(result1.claimedJobs)).toHaveLength(1);

      // Second poll finds nothing (job is now processing)
      const result2 = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });
      expect(ownJobs(result2.claimedJobs)).toHaveLength(0);
    });

    it('uses default maxConcurrent of 5 when no config provided', async () => {
      // Create 10 jobs
      await Promise.all(Array.from({ length: 10 }, () => createTestJob()));

      const result = await pollAndClaimJobs();

      // Should claim 5 (default maxConcurrent)
      expect(result.count).toBe(result.claimedJobs.length);
      expect(ownJobs(result.claimedJobs)).toHaveLength(5);
    });
  });

  describe('concurrent polling (FOR UPDATE SKIP LOCKED)', () => {
    it('skips a job another worker holds locked, without waiting for it', async () => {
      const locked = await createTestJob({ priority: 1 });
      const free = await createTestJob({ priority: 4 });

      // Another worker's open transaction holds the highest-priority job
      const otherWorker = await pool.connect();
      let poll: Promise<Awaited<ReturnType<typeof pollAndClaimJobs>>> | undefined;

      try {
        await otherWorker.query('BEGIN');
        await otherWorker.query('SELECT id FROM process_jobs WHERE id = $1 FOR UPDATE', [
          locked.id,
        ]);

        poll = pollAndClaimJobs({ maxConcurrentByType: { score_assessment: 5 } });
        const outcome = await Promise.race([
          poll,
          new Promise<'blocked'>((resolve) => {
            setTimeout(() => {
              resolve('blocked');
            }, 2000);
          }),
        ]);

        expect(outcome).not.toBe('blocked');
        expect(
          outcome === 'blocked' ? [] : ownJobs(outcome.claimedJobs).map((job) => job.id)
        ).toEqual([free.id]);
      } finally {
        try {
          await otherWorker.query('ROLLBACK');
        } finally {
          otherWorker.release();
        }
        // A poll that did block finishes once the lock is gone; let it settle before clean-up
        await poll?.catch(() => undefined);
      }

      const [lockedNow] = await db
        .select()
        .from(schema.processJobs)
        .where(eq(schema.processJobs.id, locked.id));
      expect(lockedNow.status).toBe('queued');
    });

    it('never claims a job twice when two pollers run concurrently', async () => {
      // Create 5 jobs
      const jobs = await Promise.all(Array.from({ length: 5 }, () => createTestJob()));

      // Run two pollers concurrently, each trying to claim 5 jobs
      const [result1, result2] = await Promise.all([
        pollAndClaimJobs({ maxConcurrentByType: { score_assessment: 5 } }),
        pollAndClaimJobs({ maxConcurrentByType: { score_assessment: 5 } }),
      ]);

      const ourResult1Jobs = ownJobs(result1.claimedJobs);
      const ourResult2Jobs = ownJobs(result2.claimedJobs);

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

    it('stores a database failure without its query, parameters or detail', async () => {
      const job = await createTestJob({ status: 'processing' });

      await failJob(
        job,
        drizzleDriverError({
          code: '23503',
          constraint: 'users_location_id_locations_id_fk',
          table: 'users',
        })
      );

      const [updatedJob] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${job.id}`);

      expect(updatedJob.message).toBe('Database driver error');
      expectNothingLeakable(String(updatedJob.message));
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
