/**
 * Job Queue Service Integration Tests
 *
 * Tests job queuing operations against a real PostgreSQL database (ffp_test).
 * These tests verify that the service correctly creates jobs with proper
 * tenant isolation and default values.
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

import { queueJob } from './job-queue.service';

import type { TenantContext, UserActor } from '../lib/context';

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
  let db: ReturnType<typeof drizzle>;
  let testTenantId: string;
  let testContext: TenantContext;

  beforeAll(() => {
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
  });

  beforeEach(async () => {
    // Create unique test tenant for each test to avoid conflicts with parallel tests
    // We don't truncate tables to avoid deadlocks with other test files
    testTenantId = randomUUID();

    // Set RLS context first since tenants table has RLS enabled
    await db.execute(sql.raw(`SET app.tenant_id = '${testTenantId}'`));
    await db.insert(schema.tenants).values({
      id: testTenantId,
      name: `Test Tenant ${testTenantId.slice(0, 8)}`,
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
      tenantId: testTenantId,
      customerId: null,
      requestId: randomUUID(),
      timestamp: new Date(),
    };
  });

  afterEach(async () => {
    // Clean up test data created by this test (delete by tenant_id to avoid conflicts)
    if (testTenantId) {
      await db.execute(sql`DELETE FROM process_jobs WHERE tenant_id = ${testTenantId}`);
      await db.execute(sql.raw(`SET app.tenant_id = '${testTenantId}'`));
      await db.execute(sql`DELETE FROM tenants WHERE id = ${testTenantId}`);
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
      };

      const jobId = await queueJob('score_assessment', payload, testContext);

      expect(jobId).toBeDefined();
      expect(jobId).toMatch(/^[0-9a-f-]{36}$/);

      // Verify job was created with correct values
      const [job] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${jobId}`);

      expect(job).toBeDefined();
      expect(job.tenantId).toBe(testTenantId);
      expect(job.type).toBe('score_assessment');
      expect(job.status).toBe('queued');
      expect(job.priority).toBe(4); // Default priority
      expect(job.maxAttempts).toBe(3); // Default max attempts
      expect(job.attempts).toBe(0);
      expect(job.payload).toEqual(payload);
      expect(job.result).toBeNull();
      expect(job.lastError).toBeNull();
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
      };

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
      };

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
      };

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

    it('creates a generate_program job type', async () => {
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

      const jobId = await queueJob('generate_program', payload, testContext);

      const [job] = await db
        .select()
        .from(schema.processJobs)
        .where(sql`id = ${jobId}`);

      expect(job.type).toBe('generate_program');
      expect(job.payload).toEqual(payload);
    });

    it('associates job with correct tenant from context', async () => {
      // Create a second tenant
      const secondTenantId = randomUUID();
      await db.execute(sql.raw(`SET app.tenant_id = '${secondTenantId}'`));
      await db.insert(schema.tenants).values({
        id: secondTenantId,
        name: `Second Tenant ${secondTenantId.slice(0, 8)}`,
        type: 'business',
      });
      // Reset RLS context back to first tenant for subsequent operations
      await db.execute(sql.raw(`SET app.tenant_id = '${testTenantId}'`));

      const secondContext: TenantContext = {
        ...testContext,
        tenantId: secondTenantId,
      };

      const payload = {
        assessmentSubmissionId: randomUUID(),
        templateId: randomUUID(),
        userId: randomUUID(),
        responses: [{ questionId: randomUUID(), answerValue: 5 }],
      };

      // Queue jobs for different tenants
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

      expect(job1.tenantId).toBe(testTenantId);
      expect(job2.tenantId).toBe(secondTenantId);

      // Clean up second tenant's data
      await db.execute(sql`DELETE FROM process_jobs WHERE tenant_id = ${secondTenantId}`);
      await db.execute(sql.raw(`SET app.tenant_id = '${secondTenantId}'`));
      await db.execute(sql`DELETE FROM tenants WHERE id = ${secondTenantId}`);
    });
  });
});
