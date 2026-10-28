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
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

import { flowSteps } from '@ffp/database/schema';
import {
  asOrganisation,
  connectTestDb,
  deleteOrganisations,
  type TestDb,
} from '@ffp/database/testing';

import * as safetyTriggerRepository from '../../src/assessments/safety-trigger.repository';
import * as userAssessmentRepository from '../../src/assessments/user-assessment.repository';
import { NotFoundError, ValidationError } from '../../src/lib/errors';
import { warningSchema } from '../../src/schemas/warning.schema';

import type { Pool } from 'pg';

/**
 * Generate unique test identifiers per test run to avoid conflicts
 * with other parallel tests using the same database
 */
const TEST_RUN_ID = randomUUID().substring(0, 8);

describe('User Assessment Repository', () => {
  let pool: Pool;
  let db: TestDb;

  // Test data IDs
  let organisationAId: string;
  let organisationBId: string;
  let locationAId: string;
  let userA1Id: string;
  let userB1Id: string;
  let flowId: string;

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  beforeEach(async () => {
    // Create test data for two organisations before EACH test
    // Use unique UUIDs to avoid conflicts with parallel tests
    organisationAId = randomUUID();
    organisationBId = randomUUID();

    // Organisation A, its location and User A1, under A's own context
    locationAId = randomUUID();
    userA1Id = randomUUID();
    await asOrganisation(db, organisationAId, async (tx) => {
      await tx.execute(sql`
        INSERT INTO organisations (id, public_id, type, name, settings)
        VALUES (${organisationAId}, ${randomUUID().replace(/-/g, '').slice(0, 12)}, 'business', ${`Test Organisation A [${TEST_RUN_ID}]`}, '{}')
      `);
      // Use locationAId (UUID) for unique account_code to avoid conflicts
      await tx.execute(sql`
        INSERT INTO locations (id, public_id, organisation_id, name, account_code, status)
        VALUES (${locationAId}, ${randomUUID().replace(/-/g, '').slice(0, 12)}, ${organisationAId}, 'Location A', ${`LOC-${locationAId.substring(0, 8)}`}, 'active')
      `);
      await tx.execute(sql`
        INSERT INTO users (id, public_id, organisation_id, location_id, email, cognito_sub, first_name, last_name, role)
        VALUES (${userA1Id}, ${randomUUID().replace(/-/g, '').slice(0, 12)}, ${organisationAId}, ${locationAId}, ${`user-${userA1Id.substring(0, 8)}@test.com`}, ${`cognito-${userA1Id.substring(0, 8)}`}, 'Alice', 'Anderson', 'programme_user')
      `);
    });

    // Organisation B and User B1 (individual user, no location), under B's own context
    userB1Id = randomUUID();
    await asOrganisation(db, organisationBId, async (tx) => {
      await tx.execute(sql`
        INSERT INTO organisations (id, public_id, type, name, settings)
        VALUES (${organisationBId}, ${randomUUID().replace(/-/g, '').slice(0, 12)}, 'individual', ${`Test Organisation B [${TEST_RUN_ID}]`}, '{}')
      `);
      await tx.execute(sql`
        INSERT INTO users (id, public_id, organisation_id, location_id, email, cognito_sub, first_name, last_name, role)
        VALUES (${userB1Id}, ${randomUUID().replace(/-/g, '').slice(0, 12)}, ${organisationBId}, NULL, ${`user-${userB1Id.substring(0, 8)}@test.com`}, ${`cognito-${userB1Id.substring(0, 8)}`}, 'Bob', 'Brown', 'programme_user')
      `);
    });

    // Create Assessment Flow (shared, no RLS - flows are system-managed)
    flowId = randomUUID();
    await db.execute(sql`
      INSERT INTO assessment_flows (id, public_id, name, is_active)
      VALUES (
        ${flowId},
        ${randomUUID().replace(/-/g, '').slice(0, 12)},
        ${`Test Flow [${TEST_RUN_ID}]`},
        true
      )
    `);
  });

  afterEach(async () => {
    // Each organisation under its own context: its users, location, assessments and
    // safety triggers cascade. Then the shared flow they referenced.
    await deleteOrganisations(db, [organisationAId, organisationBId]);
    await db.execute(sql`DELETE FROM assessment_flows WHERE id = ${flowId}`);
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

    it("starts at the flow's first active step when no active step holds order 1", async () => {
      await db.insert(flowSteps).values([
        { flowId, order: 1, type: 'intro', config: { title: 'Removed' }, isActive: false },
        { flowId, order: 3, type: 'results', config: { title: 'Results' } },
        { flowId, order: 2, type: 'transition', config: { title: 'First active' } },
      ]);

      const result = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      expect(result.currentStep).toBe(2);
    });

    it('starts at step 1 when the flow has no active step, as there is none to start on', async () => {
      await db
        .insert(flowSteps)
        .values({ flowId, order: 2, type: 'intro', config: { title: 'Removed' }, isActive: false });

      const result = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      expect(result.currentStep).toBe(1);
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
  });

  describe('Safety triggers and acknowledgement', () => {
    const createTriggered = async (): Promise<string> => {
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      await safetyTriggerRepository.recordTrigger({
        organisationId: organisationAId,
        userAssessmentId: assessment.id,
        userId: userA1Id,
        questionSlug: 'safety-check',
        selectedOptions: ['dizziness'],
        warningMessage: 'Please speak to a health professional before you start.',
      });

      return assessment.id;
    };

    it('records an assessment once, ignoring a second record', async () => {
      const assessmentId = await createTriggered();

      await safetyTriggerRepository.recordTrigger({
        organisationId: organisationAId,
        userAssessmentId: assessmentId,
        userId: userA1Id,
        questionSlug: 'safety-check',
        selectedOptions: ['chest-pain'],
        warningMessage: 'A second message',
      });

      const rows = await asOrganisation(db, organisationAId, (tx) =>
        tx.execute(
          sql`SELECT selected_options FROM assessment_safety_triggers WHERE user_assessment_id = ${assessmentId}`
        )
      );

      expect(rows.rows).toEqual([{ selected_options: ['dizziness'] }]);
    });

    it('finds a trigger only for its own organisation', async () => {
      const assessmentId = await createTriggered();

      expect(
        await safetyTriggerRepository.findByAssessmentId(organisationAId, assessmentId)
      ).toMatchObject({ userAssessmentId: assessmentId, organisationId: organisationAId });
      expect(
        await safetyTriggerRepository.findByAssessmentId(organisationBId, assessmentId)
      ).toBeNull();
    });

    it('hides a trigger from another organisation (RLS)', async () => {
      const assessmentId = await createTriggered();

      // No organisation filter in the query: only the policy decides what is visible
      const visibleTo = async (organisationId: string): Promise<unknown[]> =>
        (
          await asOrganisation(db, organisationId, (tx) =>
            tx.execute(sql`SELECT user_assessment_id FROM assessment_safety_triggers`)
          )
        ).rows;

      expect(await visibleTo(organisationAId)).toEqual([{ user_assessment_id: assessmentId }]);
      expect(await visibleTo(organisationBId)).toEqual([]);
    });

    it('refuses a trigger written into another organisation (RLS)', async () => {
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      await expect(
        db.transaction(async (tx) => {
          await tx.execute(sql.raw(`SET LOCAL app.organisation_id = '${organisationBId}'`));
          await tx.execute(sql`
            INSERT INTO assessment_safety_triggers
              (organisation_id, user_assessment_id, user_id, selected_options, warning_message)
            VALUES (${organisationAId}, ${assessment.id}, ${userA1Id}, '[]', 'Advice')
          `);
        })
      ).rejects.toMatchObject({
        cause: { message: expect.stringMatching(/row-level security/) as unknown },
      });
      expect(
        await safetyTriggerRepository.findByAssessmentId(organisationAId, assessment.id)
      ).toBeNull();
    });

    it('keeps the first acknowledgement on a repeat', async () => {
      const assessmentId = await createTriggered();

      const first = await userAssessmentRepository.acknowledgeSafetyAdvice(
        organisationAId,
        assessmentId
      );
      const second = await userAssessmentRepository.acknowledgeSafetyAdvice(
        organisationAId,
        assessmentId
      );

      expect(first.safetyAcknowledgedAt).toBeInstanceOf(Date);
      expect(second.safetyAcknowledgedAt).toEqual(first.safetyAcknowledgedAt);
    });

    it('reports another organisation’s assessment as not found when acknowledging', async () => {
      const assessmentId = await createTriggered();

      await expect(
        userAssessmentRepository.acknowledgeSafetyAdvice(organisationBId, assessmentId)
      ).rejects.toThrow(NotFoundError);
    });

    it('cannot acknowledge another organisation’s assessment (RLS)', async () => {
      const assessmentId = await createTriggered();

      // No organisation filter in the update: only the policy stops it
      const updated = await asOrganisation(db, organisationBId, (tx) =>
        tx.execute(
          sql`UPDATE user_assessments SET safety_acknowledged_at = now() WHERE id = ${assessmentId}`
        )
      );

      expect(updated.rowCount).toBe(0);
      const stored = await asOrganisation(db, organisationAId, (tx) =>
        tx.execute(
          sql`SELECT safety_acknowledged_at FROM user_assessments WHERE id = ${assessmentId}`
        )
      );
      expect(stored.rows).toEqual([{ safety_acknowledged_at: null }]);
    });
  });

  describe('Writes', () => {
    /** A second member of organisation A, so a write can be judged against a neighbour's row. */
    const addSecondMemberOfA = async (): Promise<string> => {
      const userA2Id = randomUUID();

      await asOrganisation(db, organisationAId, async (tx) => {
        await tx.execute(sql`
          INSERT INTO users (id, public_id, organisation_id, location_id, email, cognito_sub, first_name, last_name, role)
          VALUES (${userA2Id}, ${randomUUID().replace(/-/g, '').slice(0, 12)}, ${organisationAId}, ${locationAId}, ${`user-${userA2Id.substring(0, 8)}@test.com`}, ${`cognito-${userA2Id.substring(0, 8)}`}, 'Amira', 'Ahmed', 'programme_user')
        `);
      });

      return userA2Id;
    };

    const startInProgress = async (userId: string): Promise<string> => {
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId,
        flowId,
      });
      await userAssessmentRepository.transitionAssessmentStatus(
        organisationAId,
        assessment.id,
        'in_progress'
      );

      return assessment.id;
    };

    /** Reads organisation A's row back under A's own context. */
    const storedInA = async (
      assessmentId: string
    ): Promise<{ status: string; current_step: number; warnings_shown: unknown }> => {
      const result = await asOrganisation(db, organisationAId, (tx) =>
        tx.execute<{ status: string; current_step: number; warnings_shown: unknown }>(
          sql`SELECT status, current_step, warnings_shown FROM user_assessments WHERE id = ${assessmentId}`
        )
      );

      expect(result.rows).toHaveLength(1);

      return result.rows[0];
    };

    it('appends warnings to those already recorded, in order', async () => {
      const assessmentId = await startInProgress(userA1Id);
      const first = warningSchema.parse({
        message: 'First warning',
        type: 'caution',
        shownAt: '2026-10-21T09:00:00.000Z',
      });
      const second = warningSchema.parse({
        message: 'Second warning',
        type: 'seek_medical',
        shownAt: '2026-10-21T09:05:00.000Z',
        triggeredBy: 'safety-check',
      });

      await userAssessmentRepository.appendAssessmentWarnings(organisationAId, assessmentId, [
        first,
      ]);
      await userAssessmentRepository.appendAssessmentWarnings(organisationAId, assessmentId, [
        second,
      ]);

      expect((await storedInA(assessmentId)).warnings_shown).toEqual([first, second]);
    });

    it('abandons only the reassessing member’s in-progress assessment, not a neighbour’s in the same organisation', async () => {
      const userA2Id = await addSecondMemberOfA();
      const ownId = await startInProgress(userA1Id);
      const neighbourId = await startInProgress(userA2Id);

      // RLS isolates organisations only: the userId filter is all that separates A1 from A2
      const abandoned = await userAssessmentRepository.abandonInProgressAssessments(
        organisationAId,
        userA1Id,
        flowId
      );

      expect(abandoned).toBe(1);
      expect((await storedInA(ownId)).status).toBe('abandoned');
      expect((await storedInA(neighbourId)).status).toBe('in_progress');
    });

    it('lets a not-started assessment be abandoned on its own', async () => {
      const notStarted = await userAssessmentRepository.createUserAssessment({
        organisationId: organisationAId,
        userId: userA1Id,
        flowId,
      });

      await userAssessmentRepository.transitionAssessmentStatus(
        organisationAId,
        notStarted.id,
        'abandoned'
      );

      expect((await storedInA(notStarted.id)).status).toBe('abandoned');
    });

    it('abandons the member’s not-started and in-progress assessments, and none further on', async () => {
      const statuses = [
        'not_started',
        'in_progress',
        'submitted',
        'scored',
        'completed',
        'abandoned',
      ] as const;
      const ids = await Promise.all(
        statuses.map(async (status) => {
          const { id } = await userAssessmentRepository.createUserAssessment({
            organisationId: organisationAId,
            userId: userA1Id,
            flowId,
          });
          await asOrganisation(db, organisationAId, (tx) =>
            tx.execute(sql`UPDATE user_assessments SET status = ${status} WHERE id = ${id}`)
          );

          return id;
        })
      );

      const abandoned = await userAssessmentRepository.abandonInProgressAssessments(
        organisationAId,
        userA1Id,
        flowId
      );

      expect(abandoned).toBe(2);
      expect(await Promise.all(ids.map(async (id) => (await storedInA(id)).status))).toEqual([
        'abandoned',
        'abandoned',
        'submitted',
        'scored',
        'completed',
        'abandoned',
      ]);
    });

    describe('in a transaction scoped to another organisation', () => {
      // The InTx bodies filter on the assessment id alone, so only RLS stops these writes
      const asOrganisationB = <T>(
        callback: Parameters<typeof asOrganisation<Record<string, never>, T>>[2]
      ): Promise<T> => asOrganisation(db, organisationBId, callback);

      it('reports organisation A’s assessment as not found to a progress update, and leaves it unchanged', async () => {
        const assessmentId = await startInProgress(userA1Id);

        await expect(
          asOrganisationB((tx) =>
            userAssessmentRepository.updateAssessmentProgress(
              organisationBId,
              assessmentId,
              { currentStep: 7 },
              { tx }
            )
          )
        ).rejects.toMatchObject({
          name: 'NotFoundError',
          message: `User assessment with id ${assessmentId} not found`,
        });

        expect(await storedInA(assessmentId)).toMatchObject({
          status: 'in_progress',
          current_step: 1,
        });
      });

      it('reports organisation A’s assessment as not found to a status transition, and leaves it unchanged', async () => {
        const assessmentId = await startInProgress(userA1Id);

        await expect(
          asOrganisationB((tx) =>
            userAssessmentRepository.transitionAssessmentStatus(
              organisationBId,
              assessmentId,
              'submitted',
              { tx }
            )
          )
        ).rejects.toMatchObject({
          name: 'NotFoundError',
          message: `User assessment with id ${assessmentId} not found`,
        });

        expect((await storedInA(assessmentId)).status).toBe('in_progress');
      });
    });
  });
});
