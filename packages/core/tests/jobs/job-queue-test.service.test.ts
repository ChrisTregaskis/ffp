/**
 * Job Queue Service Integration Tests
 *
 * NOTE: This file was original named job-queue.service.test.ts however
 * due to file curruption, is recreated with this name.
 *
 * Tests job queuing operations against a real PostgreSQL database (ffp_test).
 * These tests verify that the service correctly creates jobs with proper
 * organisation isolation and default values.
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

import { queueJob } from '../../src/jobs/job-queue.service';

import type { JobPayloadMap } from '../../src/jobs/job-queue.service';
import type { OrganisationContext, UserActor } from '../../src/lib/context';

// We need to mock getDb but keep other exports
// Using hoisted mock with partial implementation
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

describe('Job Queue Service', () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;
  let testOrganisationId: string;
  let testContext: OrganisationContext;

  beforeAll(() => {
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
  });

  beforeEach(async () => {
    // Create unique test organisation for each test to avoid conflicts with parallel tests
    // We don't truncate tables to avoid deadlocks with other test files
    testOrganisationId = randomUUID();

    // Set RLS context first since organisations table has RLS enabled
    await setTestRLSContext(db, testOrganisationId);
    await db.insert(schema.organisations).values({
      id: testOrganisationId,
      name: `Test Organisation ${testOrganisationId.slice(0, 8)}`,
      type: 'business',
    });

    // Create test context
    const userActor: UserActor = {
      type: 'user',
      userId: randomUUID(),
      userRole: 'customer_owner',
      email: 'test@example.com',
    };

    testContext = {
      actor: userActor,
      organisationId: testOrganisationId,
      locationId: null,
      requestId: randomUUID(),
      timestamp: new Date(),
    };
  });

  afterEach(async () => {
    // Clean up test data created by this test (delete by organisation_id to avoid conflicts)
    if (testOrganisationId) {
      await db.execute(sql`DELETE FROM process_jobs WHERE organisation_id = ${testOrganisationId}`);
      await setTestRLSContext(db, testOrganisationId);
      await db.execute(sql`DELETE FROM organisations WHERE id = ${testOrganisationId}`);
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('queueJob', () => {
    it('creates a job with default priority and maxAttempts', async () => {
      const payload = {
        assessmentSubmissionId: randomUUID(),
        templateId: randomUUID(),
        userId: randomUUID(),
        responses: [{ questionId: randomUUID(), answerValue: 5 }],
      } as unknown as JobPayloadMap['score_assessment'];

      const jobId = await queueJob<'score_assessment'>('score_assessment', payload, testContext);

      expect(jobId).toBeDefined();
      expect(jobId).toMatch(/^[0-9a-f-]{36}$/);

      // Verify job was created with correct values
      const [job] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${jobId}`);

      expect(job).toBeDefined();
      expect(job.organisationId).toBe(testOrganisationId);
      expect(job.type).toBe('score_assessment');
      expect(job.status).toBe('queued');
      expect(job.priority).toBe(4); // Default priority
      expect(job.maxAttempts).toBe(3); // Default max attempts
      expect(job.attempts).toBe(0);
      expect(job.payload).toEqual(payload);
      expect(job.result).toBeNull();
      expect(job.message).toBeNull();
      expect(job.retryAfter).toBeNull();
      expect(job.startedAt).toBeNull();
      expect(job.completedAt).toBeNull();
      expect(job.createdAt).toBeInstanceOf(Date);
    });

    it('creates a job with custom priority', async () => {
      const payload = {
        assessmentSubmissionId: randomUUID(),
        templateId: randomUUID(),
        userId: randomUUID(),
        responses: [{ questionId: randomUUID(), answerValue: 5 }],
      } as unknown as JobPayloadMap['score_assessment'];

      const jobId = await queueJob('score_assessment', payload, testContext, {
        priority: 1,
      });

      const [job] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${jobId}`);

      expect(job.priority).toBe(1);
    });

    it('creates a job with custom maxAttempts', async () => {
      const payload = {
        assessmentSubmissionId: randomUUID(),
        templateId: randomUUID(),
        userId: randomUUID(),
        responses: [{ questionId: randomUUID(), answerValue: 5 }],
      } as unknown as JobPayloadMap['score_assessment'];

      const jobId = await queueJob('score_assessment', payload, testContext, {
        maxAttempts: 5,
      });

      const [job] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${jobId}`);

      expect(job.maxAttempts).toBe(5);
    });

    it('creates a job with both priority and maxAttempts', async () => {
      const payload = {
        assessmentSubmissionId: randomUUID(),
        templateId: randomUUID(),
        userId: randomUUID(),
        responses: [{ questionId: randomUUID(), answerValue: 5 }],
      } as unknown as JobPayloadMap['score_assessment'];

      const jobId = await queueJob('score_assessment', payload, testContext, {
        priority: 2,
        maxAttempts: 10,
      });

      const [job] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${jobId}`);

      expect(job.priority).toBe(2);
      expect(job.maxAttempts).toBe(10);
    });

    it('creates a generate_programme job type', async () => {
      const payload = {
        assessmentSubmissionId: randomUUID(),
        userId: randomUUID(),
        scores: [
          {
            dimensionId: 'mobility',
            dimensionName: 'Mobility',
            rawScore: 75,
            normalisedScore: 75,
          },
        ],
      };

      const jobId = await queueJob('generate_programme', payload, testContext);

      const [job] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${jobId}`);

      expect(job.type).toBe('generate_programme');
      expect(job.payload).toEqual(payload);
    });

    it('associates job with correct organisation from context', async () => {
      // Create a second organisation
      const secondOrganisationId = randomUUID();
      await setTestRLSContext(db, secondOrganisationId);
      await db.insert(schema.organisations).values({
        id: secondOrganisationId,
        name: `Second Organisation ${secondOrganisationId.slice(0, 8)}`,
        type: 'business',
      });
      // Reset RLS context back to first organisation for subsequent operations
      await setTestRLSContext(db, testOrganisationId);

      const secondContext: OrganisationContext = {
        ...testContext,
        organisationId: secondOrganisationId,
      };

      const payload = {
        assessmentSubmissionId: randomUUID(),
        templateId: randomUUID(),
        userId: randomUUID(),
        responses: [{ questionId: randomUUID(), answerValue: 5 }],
      } as unknown as JobPayloadMap['score_assessment'];

      // Queue jobs for different organisations
      const job1Id = await queueJob('score_assessment', payload, testContext);
      const job2Id = await queueJob('score_assessment', payload, secondContext);

      const [job1] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${job1Id}`);

      const [job2] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${job2Id}`);

      expect(job1.organisationId).toBe(testOrganisationId);
      expect(job2.organisationId).toBe(secondOrganisationId);

      // Clean up second organisation's data
      await db.execute(
        sql`DELETE FROM process_jobs WHERE organisation_id = ${secondOrganisationId}`
      );
      await setTestRLSContext(db, secondOrganisationId);
      await db.execute(sql`DELETE FROM organisations WHERE id = ${secondOrganisationId}`);
    });
  });
});
