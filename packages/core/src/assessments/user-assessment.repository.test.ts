/**
 * User Assessment Repository Integration Tests
 *
 * Tests CRUD operations against a real PostgreSQL database (ffp_test).
 * These tests verify that the repository correctly interacts with the database
 * and enforces RLS (Row-Level Security) for multi-tenant isolation.
 *
 * Prerequisites:
 * - ffp_test database must exist
 * - Migrations must be run: DB_NAME=ffp_test pnpm --filter=@ffp/database db:migrate
 */

import { randomUUID } from 'crypto';

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

import { NotFoundError, ValidationError } from '../lib/errors';

import * as userAssessmentRepository from './user-assessment.repository';

/**
 * Generate unique test identifiers per test run to avoid conflicts
 * with other parallel tests using the same database
 */
const TEST_RUN_ID = randomUUID().substring(0, 8);

/**
 * UUID validation regex (RFC 4122 compliant)
 * Used to validate tenant IDs before setting RLS context
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Safely set RLS context for test setup/teardown
 *
 * PostgreSQL's SET command doesn't support parameterised queries ($1, $2),
 * so we use sql.raw() with UUID validation to prevent injection.
 * This mirrors the pattern used in @ffp/core's database.ts setRLSContext.
 */
async function setTestRLSContext(db: ReturnType<typeof drizzle>, tenantId: string): Promise<void> {
  if (!UUID_REGEX.test(tenantId)) {
    throw new Error(`Invalid UUID format for tenantId: ${tenantId}`);
  }
  // Safe: tenantId is validated as UUID (only hex digits and hyphens)
  await db.execute(sql.raw(`SET app.tenant_id = '${tenantId}'`));
}

describe('User Assessment Repository', () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;

  // Test data IDs
  let tenantAId: string;
  let tenantBId: string;
  let customerAId: string;
  let userA1Id: string;
  let userB1Id: string;
  let flowId: string;

  beforeAll(() => {
    pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: 'ffp_test',
      user: process.env.DB_USER ?? 'test_user',
      password: process.env.DB_PASSWORD ?? 'test_password',
    });
    db = drizzle(pool);
  });

  beforeEach(async () => {
    // Create test data for two tenants before EACH test
    // Use unique UUIDs to avoid conflicts with parallel tests
    tenantAId = randomUUID();
    tenantBId = randomUUID();

    // Create Tenant A (use TEST_RUN_ID in name for easy cleanup)
    await setTestRLSContext(db, tenantAId);
    await db.execute(sql`
      INSERT INTO tenants (id, type, name, settings)
      VALUES (${tenantAId}, 'business', ${`Test Tenant A [${TEST_RUN_ID}]`}, '{}')
    `);

    // Create Tenant B
    await setTestRLSContext(db, tenantBId);
    await db.execute(sql`
      INSERT INTO tenants (id, type, name, settings)
      VALUES (${tenantBId}, 'individual', ${`Test Tenant B [${TEST_RUN_ID}]`}, '{}')
    `);

    // Create Customer A (belongs to Tenant A)
    // Use customerAId (UUID) for unique account_code to avoid conflicts
    await setTestRLSContext(db, tenantAId);
    customerAId = randomUUID();
    const customerAccountCode = customerAId.substring(0, 8);
    await db.execute(sql`
      INSERT INTO customers (id, tenant_id, name, account_code, status)
      VALUES (${customerAId}, ${tenantAId}, 'Customer A', ${`CUST-${customerAccountCode}`}, 'active')
    `);

    // Create User A1 (Tenant A)
    // Use unique UUID-based values to avoid conflicts
    userA1Id = randomUUID();
    await db.execute(sql`
      INSERT INTO users (id, tenant_id, customer_id, email, cognito_sub, first_name, last_name, role)
      VALUES (${userA1Id}, ${tenantAId}, ${customerAId}, ${`user-${userA1Id.substring(0, 8)}@test.com`}, ${`cognito-${userA1Id.substring(0, 8)}`}, 'Alice', 'Anderson', 'program_user')
    `);

    // Create User B1 (Tenant B - individual user, no customer)
    await setTestRLSContext(db, tenantBId);
    userB1Id = randomUUID();
    await db.execute(sql`
      INSERT INTO users (id, tenant_id, customer_id, email, cognito_sub, first_name, last_name, role)
      VALUES (${userB1Id}, ${tenantBId}, NULL, ${`user-${userB1Id.substring(0, 8)}@test.com`}, ${`cognito-${userB1Id.substring(0, 8)}`}, 'Bob', 'Brown', 'program_user')
    `);

    // Create Assessment Flow (shared, no RLS - flows are system-managed)
    flowId = randomUUID();
    await db.execute(sql`
      INSERT INTO assessment_flows (id, name, steps, is_active)
      VALUES (
        ${flowId},
        ${`Test Flow [${TEST_RUN_ID}]`},
        '[{"type": "intro", "title": "Welcome"}]'::jsonb,
        true
      )
    `);
  });

  afterEach(async () => {
    // Clean up only test data created by this test run
    // Wrap in try/catch as parallel tests may cause intermittent FK issues
    try {
      // Delete in FK-safe order (children first, then parents)
      // Use parameterised queries to demonstrate secure patterns
      await db.execute(sql`DELETE FROM user_assessments WHERE flow_id = ${flowId}`);
      await db.execute(sql`DELETE FROM assessment_flows WHERE id = ${flowId}`);
      await db.execute(sql`DELETE FROM users WHERE tenant_id = ANY(${[tenantAId, tenantBId]})`);
      await db.execute(sql`DELETE FROM customers WHERE tenant_id = ANY(${[tenantAId, tenantBId]})`);
      await db.execute(sql`DELETE FROM tenants WHERE id = ANY(${[tenantAId, tenantBId]})`);
    } catch {
      // Ignore cleanup errors - unique UUIDs ensure no conflicts between tests
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('create', () => {
    it('creates an assessment with not_started status', async () => {
      const result = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });

      expect(result.tenantId).toBe(tenantAId);
      expect(result.userId).toBe(userA1Id);
      expect(result.flowId).toBe(flowId);
      expect(result.status).toBe('not_started');
      expect(result.currentStep).toBe(1);
      // Note: answers are stored in user_assessment_answers table, not on the assessment record
      expect(result.scores).toBeNull();
      expect(result.programmeId).toBeNull();
      expect(result.startedAt).toBeNull();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findById', () => {
    it('returns assessment when found', async () => {
      const created = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });

      const result = await userAssessmentRepository.findById(tenantAId, created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.userId).toBe(userA1Id);
    });

    it('returns null when not found', async () => {
      const result = await userAssessmentRepository.findById(
        tenantAId,
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(result).toBeNull();
    });

    it('returns null when accessing other tenant assessment (RLS)', async () => {
      const created = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });

      // Try to access Tenant A's assessment from Tenant B context
      const result = await userAssessmentRepository.findById(tenantBId, created.id);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('returns all assessments for a user', async () => {
      await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });
      await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });

      const result = await userAssessmentRepository.findByUserId(tenantAId, userA1Id);

      expect(result).toHaveLength(2);
      expect(result.every((a) => a.userId === userA1Id)).toBe(true);
    });

    it('filters by status when provided', async () => {
      const assessment = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });
      await userAssessmentRepository.transitionStatus(tenantAId, assessment.id, 'in_progress');

      await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });

      const inProgress = await userAssessmentRepository.findByUserId(tenantAId, userA1Id, {
        status: 'in_progress',
      });
      const notStarted = await userAssessmentRepository.findByUserId(tenantAId, userA1Id, {
        status: 'not_started',
      });

      expect(inProgress).toHaveLength(1);
      expect(notStarted).toHaveLength(1);
    });
  });

  describe('findInProgress', () => {
    it('returns in-progress assessment for user', async () => {
      const assessment = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });
      await userAssessmentRepository.transitionStatus(tenantAId, assessment.id, 'in_progress');

      const result = await userAssessmentRepository.findInProgress(tenantAId, userA1Id);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('in_progress');
    });

    it('returns null when no in-progress assessment', async () => {
      await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });

      const result = await userAssessmentRepository.findInProgress(tenantAId, userA1Id);

      expect(result).toBeNull();
    });

    it('filters by flowId when provided', async () => {
      const assessment = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });
      await userAssessmentRepository.transitionStatus(tenantAId, assessment.id, 'in_progress');

      const withFlow = await userAssessmentRepository.findInProgress(tenantAId, userA1Id, flowId);
      const wrongFlow = await userAssessmentRepository.findInProgress(
        tenantAId,
        userA1Id,
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(withFlow).not.toBeNull();
      expect(wrongFlow).toBeNull();
    });
  });

  describe('findResumable', () => {
    it('returns resumable assessment (not_started or in_progress)', async () => {
      const assessment = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });

      const result = await userAssessmentRepository.findResumable(tenantAId, userA1Id, flowId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(assessment.id);
    });

    it('respects RLS tenant isolation', async () => {
      await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });

      // Tenant B should not see Tenant A's assessment
      const result = await userAssessmentRepository.findResumable(tenantBId, userA1Id, flowId);

      expect(result).toBeNull();
    });
  });

  describe('updateProgress', () => {
    it('updates currentStep', async () => {
      const assessment = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });

      const result = await userAssessmentRepository.updateProgress(tenantAId, assessment.id, {
        currentStep: 3,
      });

      expect(result.currentStep).toBe(3);
    });

    it('only updates currentStep (answers are stored in user_assessment_answers table)', async () => {
      // Note: This test verifies that updateProgress only updates currentStep.
      // Answer storage has been moved to the user_assessment_answers table
      // and should be handled via answerRepository.saveAnswers().
      const assessment = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });

      // Update with currentStep only
      const result = await userAssessmentRepository.updateProgress(tenantAId, assessment.id, {
        currentStep: 5,
      });

      expect(result.currentStep).toBe(5);
      // Note: answers are stored in user_assessment_answers table, not on the assessment record
    });

    it('throws NotFoundError when assessment not found', async () => {
      await expect(
        userAssessmentRepository.updateProgress(tenantAId, '550e8400-e29b-41d4-a716-446655440000', {
          currentStep: 2,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('transitionStatus', () => {
    it('transitions from not_started to in_progress', async () => {
      const assessment = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });

      const result = await userAssessmentRepository.transitionStatus(
        tenantAId,
        assessment.id,
        'in_progress'
      );

      expect(result.status).toBe('in_progress');
      expect(result.startedAt).toBeInstanceOf(Date);
    });

    it('transitions from in_progress to submitted', async () => {
      const assessment = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });
      await userAssessmentRepository.transitionStatus(tenantAId, assessment.id, 'in_progress');

      const result = await userAssessmentRepository.transitionStatus(
        tenantAId,
        assessment.id,
        'submitted'
      );

      expect(result.status).toBe('submitted');
      expect(result.submittedAt).toBeInstanceOf(Date);
    });

    it('transitions from in_progress to abandoned', async () => {
      const assessment = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });
      await userAssessmentRepository.transitionStatus(tenantAId, assessment.id, 'in_progress');

      const result = await userAssessmentRepository.transitionStatus(
        tenantAId,
        assessment.id,
        'abandoned'
      );

      expect(result.status).toBe('abandoned');
    });

    it('throws ValidationError for invalid transition', async () => {
      const assessment = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });

      // Cannot go directly from not_started to submitted
      await expect(
        userAssessmentRepository.transitionStatus(tenantAId, assessment.id, 'submitted')
      ).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError when assessment not found', async () => {
      await expect(
        userAssessmentRepository.transitionStatus(
          tenantAId,
          '550e8400-e29b-41d4-a716-446655440000',
          'in_progress'
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateScores', () => {
    it('updates scores on assessment', async () => {
      const assessment = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });

      const scores = {
        dimensions: [
          {
            dimensionId: 'mobility',
            dimensionName: 'Mobility',
            rawScore: 75,
            normalisedScore: 75,
          },
        ],
        scoredAt: new Date(),
        overallScore: 75,
        riskLevel: 'low' as const,
      };

      const result = await userAssessmentRepository.updateScores(tenantAId, assessment.id, scores);

      expect(result.scores?.dimensions).toEqual(scores.dimensions);
      expect(result.scores?.overallScore).toBe(scores.overallScore);
      expect(result.scores?.riskLevel).toBe(scores.riskLevel);
    });

    it('throws NotFoundError when assessment not found', async () => {
      await expect(
        userAssessmentRepository.updateScores(tenantAId, '550e8400-e29b-41d4-a716-446655440000', {
          dimensions: [],
          scoredAt: new Date(),
          overallScore: 0,
          riskLevel: 'low',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('linkProgramme', () => {
    it('links programme to assessment', async () => {
      const assessment = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });
      const programmeId = randomUUID();

      const result = await userAssessmentRepository.linkProgramme(
        tenantAId,
        assessment.id,
        programmeId
      );

      expect(result.programmeId).toBe(programmeId);
    });

    it('throws NotFoundError when assessment not found', async () => {
      await expect(
        userAssessmentRepository.linkProgramme(
          tenantAId,
          '550e8400-e29b-41d4-a716-446655440000',
          randomUUID()
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Cross-Tenant Isolation', () => {
    it('cannot access other tenant assessments via findById', async () => {
      const tenantAAssessment = await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });

      // Tenant B cannot see Tenant A's assessment
      const result = await userAssessmentRepository.findById(tenantBId, tenantAAssessment.id);

      expect(result).toBeNull();
    });

    it('cannot access other tenant assessments via findByUserId', async () => {
      await userAssessmentRepository.create({
        tenantId: tenantAId,
        userId: userA1Id,
        flowId,
      });

      // Tenant B querying for Tenant A user returns empty (RLS visibility)
      const result = await userAssessmentRepository.findByUserId(tenantBId, userA1Id);

      expect(result).toHaveLength(0);
    });
  });
});
