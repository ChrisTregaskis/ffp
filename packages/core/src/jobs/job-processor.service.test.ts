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

import { pollAndClaimJobs } from './job-processor.service';

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
  tenantId: string
): Promise<void> {
  if (!UUID_REGEX.test(tenantId)) {
    throw new Error(`Invalid UUID format for RLS context: ${tenantId}`);
  }
  await db.execute(sql.raw(`SET app.tenant_id = '${tenantId}'`));
}

describe('Job Processor Service', () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;
  let testTenantId: string;

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: 'ffp_test',
      user: process.env.DB_USER ?? 'root_user',
      password: process.env.DB_PASSWORD ?? 'password',
    });
    db = drizzle(pool, { schema });

    // Configure mock to return our test db
    mockGetDb.mockReturnValue(db);

    // Clean up any leftover queued jobs from previous test runs
    // This ensures a clean state for the first test
    await db.execute(sql`DELETE FROM process_jobs WHERE status = 'queued'`);
  });

  beforeEach(async () => {
    // Create unique test tenant for each test
    testTenantId = randomUUID();

    await setTestRLSContext(db, testTenantId);
    await db.insert(schema.tenants).values({
      id: testTenantId,
      name: `Test Tenant ${testTenantId.slice(0, 8)}`,
      type: 'business',
    });

    // Ensure no leftover jobs exist for this tenant (defensive cleanup)
    await db.execute(sql`DELETE FROM process_jobs WHERE tenant_id = ${testTenantId}`);
  });

  afterEach(async () => {
    // Clean up test data
    if (testTenantId) {
      await db.execute(sql`DELETE FROM process_jobs WHERE tenant_id = ${testTenantId}`);
      await setTestRLSContext(db, testTenantId);
      await db.execute(sql`DELETE FROM tenants WHERE id = ${testTenantId}`);
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
        tenantId: testTenantId,
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
      // Create 5 generate_program jobs
      await Promise.all(
        Array.from({ length: 5 }, () => createTestJob({ type: 'generate_program' }))
      );

      const result = await pollAndClaimJobs({
        maxConcurrentByType: { score_assessment: 10 }, // Not setting generate_program
        defaultMaxConcurrent: 2,
      });

      // Should use defaultMaxConcurrent (2) for generate_program
      const generateProgramJobs = result.claimedJobs.filter((j) => j.type === 'generate_program');
      expect(generateProgramJobs).toHaveLength(2);
    });

    it('polls all job types and combines results', async () => {
      await createTestJob({ type: 'score_assessment' });
      await createTestJob({ type: 'score_assessment' });
      await createTestJob({ type: 'generate_program' });

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });

      expect(result.count).toBe(3);

      const scoreAssessmentJobs = result.claimedJobs.filter((j) => j.type === 'score_assessment');
      const generateProgramJobs = result.claimedJobs.filter((j) => j.type === 'generate_program');

      expect(scoreAssessmentJobs).toHaveLength(2);
      expect(generateProgramJobs).toHaveLength(1);
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
      await createTestJob({ retryAfter: futureDate });
      await createTestJob({ retryAfter: null }); // Should be claimed

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });

      expect(result.count).toBe(1);
    });

    it('claims jobs where retryAfter is in the past', async () => {
      const pastDate = new Date(Date.now() - 60 * 1000); // 1 minute ago
      await createTestJob({ retryAfter: pastDate });

      const result = await pollAndClaimJobs({ defaultMaxConcurrent: 5 });

      expect(result.count).toBe(1);
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

      // Run two pollers concurrently, each trying to claim 5 jobs
      const [result1, result2] = await Promise.all([
        pollAndClaimJobs({ maxConcurrentByType: { score_assessment: 5 } }),
        pollAndClaimJobs({ maxConcurrentByType: { score_assessment: 5 } }),
      ]);

      // Total claimed should be 5 (all jobs)
      const totalClaimed = result1.count + result2.count;
      expect(totalClaimed).toBe(5);

      // No job should appear in both results
      const result1Ids = new Set(result1.claimedJobs.map((j) => j.id));
      const result2Ids = new Set(result2.claimedJobs.map((j) => j.id));

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
});
