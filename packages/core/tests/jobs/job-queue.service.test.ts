/**
 * Job Queue Service Integration Tests
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
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

import * as schema from '@ffp/database/schema';
import {
  asOrganisation,
  connectTestDb,
  deleteOrganisations,
  type TestDb,
} from '@ffp/database/testing';

import { queueJob } from '../../src/jobs/job-queue.service';

import { jobPayload } from './job-payload.fixture';

import type { OrganisationContext, UserActor } from '../../src/lib/context';
import type { Pool } from 'pg';

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

describe('Job Queue Service', () => {
  let pool: Pool;
  let db: TestDb<typeof schema>;
  let testOrganisationId: string;
  let createdOrganisationIds: string[] = [];
  let testContext: OrganisationContext;

  beforeAll(() => {
    ({ pool, db } = connectTestDb({ schema }));

    // Configure mock to return our test db
    mockGetDb.mockReturnValue(db);
  });

  beforeEach(async () => {
    // Create unique test organisation for each test to avoid conflicts with parallel tests
    testOrganisationId = randomUUID();
    createdOrganisationIds = [testOrganisationId];

    // Organisations have RLS, so the insert runs under the new organisation's own context
    await asOrganisation(db, testOrganisationId, async (tx) => {
      await tx.insert(schema.organisations).values({
        id: testOrganisationId,
        name: `Test Organisation ${testOrganisationId.slice(0, 8)}`,
        type: 'business',
      });
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
    // The organisation's jobs go with it (ON DELETE CASCADE)
    await deleteOrganisations(db, createdOrganisationIds);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('queueJob', () => {
    it('creates a job with default priority and maxAttempts', async () => {
      const payload = jobPayload('score_assessment');

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
      const payload = jobPayload('score_assessment');

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
      const payload = jobPayload('score_assessment');

      const jobId = await queueJob('score_assessment', payload, testContext, {
        maxAttempts: 5,
      });

      const [job] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${jobId}`);

      expect(job.maxAttempts).toBe(5);
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
      createdOrganisationIds.push(secondOrganisationId);
      await asOrganisation(db, secondOrganisationId, async (tx) => {
        await tx.insert(schema.organisations).values({
          id: secondOrganisationId,
          name: `Second Organisation ${secondOrganisationId.slice(0, 8)}`,
          type: 'business',
        });
      });

      const secondContext: OrganisationContext = {
        ...testContext,
        organisationId: secondOrganisationId,
      };

      const payload = jobPayload('score_assessment');

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
    });
  });
});
