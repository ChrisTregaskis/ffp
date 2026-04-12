/**
 * User Assessment Repository Integration Tests
 *
 * Tests CRUD operations against a real PostgreSQL database (ffp_test).
 * These tests verify that the repository correctly interacts with the database
 * and enforces RLS (Row-Level Security) for multi-organisation isolation.
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

import * as userAssessmentRepository from '../../src/assessments/user-assessment.repository';
import { NotFoundError, ValidationError } from '../../src/lib/errors';

/**
 * Generate unique test identifiers per test run to avoid conflicts
 * with other parallel tests using the same database
 */
const TEST_RUN_ID = randomUUID().substring(0, 8);

/**
 * UUID validation regex (RFC 4122 compliant)
 * Used to validate organisation IDs before setting RLS context
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Safely set RLS context for test setup/teardown
 *
 * PostgreSQL's SET command doesn't support parameterised queries ($1, $2),
 * so we use sql.raw() with UUID validation to prevent injection.
 * This mirrors the pattern used in @ffp/core's database.ts setRLSContext.
 */
async function setTestRLSContext(
  db: ReturnType<typeof drizzle>,
  organisationId: string
): Promise<void> {
  if (!UUID_REGEX.test(organisationId)) {
    throw new Error(`Invalid UUID format for organisationId: ${organisationId}`);
  }
  // Safe: organisationId is validated as UUID (only hex digits and hyphens)
  await db.execute(sql.raw(`SET app.organisation_id = '${organisationId}'`));
}

describe('User Assessment Repository', () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;

  // Test data IDs
  let organisationAId: string;
  let organisationBId: string;
  let locationAId: string;
  let userA1Id: string;
  let userB1Id: string;
  let flowId: string;
  let programmeTemplateId: string;
  let programmeId: string;

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
    // Create test data for two organisations before EACH test
    // Use unique UUIDs to avoid conflicts with parallel tests
    organisationAId = randomUUID();
    organisationBId = randomUUID();

    // Create Organisation A (use TEST_RUN_ID in name for easy cleanup)
    await setTestRLSContext(db, organisationAId);
    await db.execute(sql`
      INSERT INTO organisations (id, public_id, type, name, settings)
      VALUES (${organisationAId}, ${randomUUID().replace(/-/g, '').slice(0, 12)}, 'business', ${`Test Organisation A [${TEST_RUN_ID}]`}, '{}')
    `);

    // Create Organisation B
    await setTestRLSContext(db, organisationBId);
    await db.execute(sql`
      INSERT INTO organisations (id, public_id, type, name, settings)
      VALUES (${organisationBId}, ${randomUUID().replace(/-/g, '').slice(0, 12)}, 'individual', ${`Test Organisation B [${TEST_RUN_ID}]`}, '{}')
    `);

    // Create Location A (belongs to Organisation A)
    // Use locationAId (UUID) for unique account_code to avoid conflicts
    await setTestRLSContext(db, organisationAId);
    locationAId = randomUUID();
    const locationAccountCode = locationAId.substring(0, 8);
    await db.execute(sql`
      INSERT INTO locations (id, public_id, organisation_id, name, account_code, status)
      VALUES (${locationAId}, ${randomUUID().replace(/-/g, '').slice(0, 12)}, ${organisationAId}, 'Location A', ${`LOC-${locationAccountCode}`}, 'active')
    `);

    // Create User A1 (Organisation A)
    // Use unique UUID-based values to avoid conflicts
    userA1Id = randomUUID();
    await db.execute(sql`
      INSERT INTO users (id, public_id, organisation_id, location_id, email, cognito_sub, first_name, last_name, role)
      VALUES (${userA1Id}, ${randomUUID().replace(/-/g, '').slice(0, 12)}, ${organisationAId}, ${locationAId}, ${`user-${userA1Id.substring(0, 8)}@test.com`}, ${`cognito-${userA1Id.substring(0, 8)}`}, 'Alice', 'Anderson', 'programme_user')
    `);

    // Create User B1 (Organisation B - individual user, no location)
    await setTestRLSContext(db, organisationBId);
    userB1Id = randomUUID();
    await db.execute(sql`
      INSERT INTO users (id, public_id, organisation_id, location_id, email, cognito_sub, first_name, last_name, role)
      VALUES (${userB1Id}, ${randomUUID().replace(/-/g, '').slice(0, 12)}, ${organisationBId}, NULL, ${`user-${userB1Id.substring(0, 8)}@test.com`}, ${`cognito-${userB1Id.substring(0, 8)}`}, 'Bob', 'Brown', 'programme_user')
    `);

    // Create Assessment Flow (shared, no RLS - flows are system-managed)
    flowId = randomUUID();
    await db.execute(sql`
      INSERT INTO assessment_flows (id, name, is_active)
      VALUES (
        ${flowId},
        ${`Test Flow [${TEST_RUN_ID}]`},
        true
      )
    `);

    // Create Programme Template (shared, no RLS - templates are system-managed)
    programmeTemplateId = randomUUID();
    await db.execute(sql`
      INSERT INTO programme_templates (id, public_id, slug, name, is_active)
      VALUES (
        ${programmeTemplateId},
        ${randomUUID().replace(/-/g, '').slice(0, 12)},
        ${`test-template-${TEST_RUN_ID}`},
        ${`Test Template [${TEST_RUN_ID}]`},
        true
      )
    `);

    // Create Programme (belongs to Organisation A, linked to User A1)
    await setTestRLSContext(db, organisationAId);
    programmeId = randomUUID();
    await db.execute(sql`
      INSERT INTO programmes (id, public_id, organisation_id, user_id, programme_template_id, name)
      VALUES (
        ${programmeId},
        ${randomUUID().replace(/-/g, '').slice(0, 12)},
        ${organisationAId},
        ${userA1Id},
        ${programmeTemplateId},
        ${`Test Programme [${TEST_RUN_ID}]`}
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
      await db.execute(sql`DELETE FROM programmes WHERE id = ${programmeId}`);
      await db.execute(sql`DELETE FROM programme_templates WHERE id = ${programmeTemplateId}`);
      await db.execute(sql`DELETE FROM assessment_flows WHERE id = ${flowId}`);
      await db.execute(
        sql`DELETE FROM users WHERE organisation_id = ANY(${[organisationAId, organisationBId]})`
      );
      await db.execute(
        sql`DELETE FROM locations WHERE organisation_id = ANY(${[organisationAId, organisationBId]})`
      );
      await db.execute(
        sql`DELETE FROM organisations WHERE id = ANY(${[organisationAId, organisationBId]})`
      );
    } catch {
      // Ignore cleanup errors - unique UUIDs ensure no conflicts between tests
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('create', () => {
    it('creates an assessment with not_started status', async () => {
      const result = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      expect(result.organisationId).toBe(organisationAId);
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
      const created = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      const result = await userAssessmentRepository.findUserAssessmentById(
        organisationAId,
        created.id
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.userId).toBe(userA1Id);
    });

    it('returns null when not found', async () => {
      const result = await userAssessmentRepository.findUserAssessmentById(
        organisationAId,
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(result).toBeNull();
    });

    it('returns null when accessing other organisation assessment (RLS)', async () => {
      const created = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      // Try to access Organisation A's assessment from Organisation B context
      const result = await userAssessmentRepository.findUserAssessmentById(
        organisationBId,
        created.id
      );

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('returns all assessments for a user', async () => {
      await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });
      await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      const result = await userAssessmentRepository.findByUserId(organisationAId, userA1Id);

      expect(result).toHaveLength(2);
      expect(result.every((a) => a.userId === userA1Id)).toBe(true);
    });

    it('filters by status when provided', async () => {
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });
      await userAssessmentRepository.transitionAssessmentStatus(
        organisationAId,
        assessment.id,
        'in_progress'
      );

      await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      const inProgress = await userAssessmentRepository.findByUserId(organisationAId, userA1Id, {
        status: 'in_progress',
      });
      const notStarted = await userAssessmentRepository.findByUserId(organisationAId, userA1Id, {
        status: 'not_started',
      });

      expect(inProgress).toHaveLength(1);
      expect(notStarted).toHaveLength(1);
    });
  });

  describe('findInProgress', () => {
    it('returns in-progress assessment for user', async () => {
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });
      await userAssessmentRepository.transitionAssessmentStatus(
        organisationAId,
        assessment.id,
        'in_progress'
      );

      const result = await userAssessmentRepository.findAssessmentInProgress(
        organisationAId,
        userA1Id
      );

      expect(result).not.toBeNull();
      expect(result?.status).toBe('in_progress');
    });

    it('returns null when no in-progress assessment', async () => {
      await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      const result = await userAssessmentRepository.findAssessmentInProgress(
        organisationAId,
        userA1Id
      );

      expect(result).toBeNull();
    });

    it('filters by flowId when provided', async () => {
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });
      await userAssessmentRepository.transitionAssessmentStatus(
        organisationAId,
        assessment.id,
        'in_progress'
      );

      const withFlow = await userAssessmentRepository.findAssessmentInProgress(
        organisationAId,
        userA1Id,
        flowId
      );
      const wrongFlow = await userAssessmentRepository.findAssessmentInProgress(
        organisationAId,
        userA1Id,
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(withFlow).not.toBeNull();
      expect(wrongFlow).toBeNull();
    });
  });

  describe('findResumable', () => {
    it('returns resumable assessment (not_started or in_progress)', async () => {
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      const result = await userAssessmentRepository.findResumableAssessment(
        organisationAId,
        userA1Id,
        flowId
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe(assessment.id);
    });

    it('respects RLS organisation isolation', async () => {
      await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      // Organisation B should not see Organisation A's assessment
      const result = await userAssessmentRepository.findResumableAssessment(
        organisationBId,
        userA1Id,
        flowId
      );

      expect(result).toBeNull();
    });
  });

  describe('updateProgress', () => {
    it('updates currentStep', async () => {
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      const result = await userAssessmentRepository.updateAssessmentProgress(
        organisationAId,
        assessment.id,
        {
          currentStep: 3,
        }
      );

      expect(result.currentStep).toBe(3);
    });

    it('only updates currentStep (answers are stored in user_assessment_answers table)', async () => {
      // Note: This test verifies that updateProgress only updates currentStep.
      // Answer storage has been moved to the user_assessment_answers table
      // and should be handled via answerRepository.saveAnswers().
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      // Update with currentStep only
      const result = await userAssessmentRepository.updateAssessmentProgress(
        organisationAId,
        assessment.id,
        {
          currentStep: 5,
        }
      );

      expect(result.currentStep).toBe(5);
      // Note: answers are stored in user_assessment_answers table, not on the assessment record
    });

    it('throws NotFoundError when assessment not found', async () => {
      await expect(
        userAssessmentRepository.updateAssessmentProgress(
          organisationAId,
          '550e8400-e29b-41d4-a716-446655440000',
          {
            currentStep: 2,
          }
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('transitionStatus', () => {
    it('transitions from not_started to in_progress', async () => {
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      const result = await userAssessmentRepository.transitionAssessmentStatus(
        organisationAId,
        assessment.id,
        'in_progress'
      );

      expect(result.status).toBe('in_progress');
      expect(result.startedAt).toBeInstanceOf(Date);
    });

    it('transitions from in_progress to submitted', async () => {
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });
      await userAssessmentRepository.transitionAssessmentStatus(
        organisationAId,
        assessment.id,
        'in_progress'
      );

      const result = await userAssessmentRepository.transitionAssessmentStatus(
        organisationAId,
        assessment.id,
        'submitted'
      );

      expect(result.status).toBe('submitted');
      expect(result.submittedAt).toBeInstanceOf(Date);
    });

    it('transitions from in_progress to abandoned', async () => {
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });
      await userAssessmentRepository.transitionAssessmentStatus(
        organisationAId,
        assessment.id,
        'in_progress'
      );

      const result = await userAssessmentRepository.transitionAssessmentStatus(
        organisationAId,
        assessment.id,
        'abandoned'
      );

      expect(result.status).toBe('abandoned');
    });

    it('throws ValidationError for invalid transition', async () => {
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      // Cannot go directly from not_started to submitted
      await expect(
        userAssessmentRepository.transitionAssessmentStatus(
          organisationAId,
          assessment.id,
          'submitted'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError when assessment not found', async () => {
      await expect(
        userAssessmentRepository.transitionAssessmentStatus(
          organisationAId,
          '550e8400-e29b-41d4-a716-446655440000',
          'in_progress'
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateScores', () => {
    it('updates scores on assessment', async () => {
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
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

      const result = await userAssessmentRepository.updateAssessmentScores(
        organisationAId,
        assessment.id,
        scores
      );

      expect(result.scores?.dimensions).toEqual(scores.dimensions);
      expect(result.scores?.overallScore).toBe(scores.overallScore);
      expect(result.scores?.riskLevel).toBe(scores.riskLevel);
    });

    it('throws NotFoundError when assessment not found', async () => {
      await expect(
        userAssessmentRepository.updateAssessmentScores(
          organisationAId,
          '550e8400-e29b-41d4-a716-446655440000',
          {
            dimensions: [],
            scoredAt: new Date(),
            overallScore: 0,
            riskLevel: 'low',
          }
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('linkProgramme', () => {
    it('links programme to assessment', async () => {
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      const result = await userAssessmentRepository.linkAssessmentToProgramme(
        organisationAId,
        assessment.id,
        programmeId
      );

      expect(result.programmeId).toBe(programmeId);
    });

    it('throws NotFoundError when assessment not found', async () => {
      await expect(
        userAssessmentRepository.linkAssessmentToProgramme(
          organisationAId,
          '550e8400-e29b-41d4-a716-446655440000',
          randomUUID()
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Cross-Organisation Isolation', () => {
    it('cannot access other organisation assessments via findById', async () => {
      const organisationAAssessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      // Organisation B cannot see Organisation A's assessment
      const result = await userAssessmentRepository.findUserAssessmentById(
        organisationBId,
        organisationAAssessment.id
      );

      expect(result).toBeNull();
    });

    it('cannot access other organisation assessments via findByUserId', async () => {
      await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      // Organisation B querying for Organisation A user returns empty (RLS visibility)
      const result = await userAssessmentRepository.findByUserId(organisationBId, userA1Id);

      expect(result).toHaveLength(0);
    });
  });
});
