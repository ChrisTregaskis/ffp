import { randomUUID } from 'crypto';

import { asc, eq, inArray, sql } from 'drizzle-orm';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

import { assessmentFlows, questions, userAssessmentAnswers } from '@ffp/database/schema';

import * as answerRepository from '../../src/assessments/answer.repository';
import * as userAssessmentRepository from '../../src/assessments/user-assessment.repository';
import { asOrganisation, deleteOrganisations } from '../lib/rls-context.fixture';
import { connectTestDb, type TestDb } from '../lib/test-db.fixture';

import type { Pool } from 'pg';

// Questions and flows are shared catalogue tables: every slug and name carries a per-run
// marker, and clean-up deletes only the ids recorded here
const RUN_ID = randomUUID().slice(0, 8);

const publicId = (): string => randomUUID().replace(/-/g, '').slice(0, 12);

describe('Answer Repository', () => {
  let pool: Pool;
  let db: TestDb;

  let organisationAId: string;
  let organisationBId: string;
  let userAId: string;
  let flowId: string;
  let questionIds: string[];

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  beforeEach(async () => {
    organisationAId = randomUUID();
    organisationBId = randomUUID();
    userAId = randomUUID();

    await asOrganisation(db, organisationAId, async (tx) => {
      await tx.execute(sql`
        INSERT INTO organisations (id, public_id, type, name, settings)
        VALUES (${organisationAId}, ${publicId()}, 'individual', ${`Answer Organisation A [${RUN_ID}]`}, '{}')
      `);
      await tx.execute(sql`
        INSERT INTO users (id, public_id, organisation_id, location_id, email, cognito_sub, first_name, last_name, role)
        VALUES (${userAId}, ${publicId()}, ${organisationAId}, NULL, ${`answer-${userAId.slice(0, 8)}@test.com`}, ${`cognito-${userAId.slice(0, 8)}`}, 'Ada', 'Answer', 'programme_user')
      `);
    });
    await asOrganisation(db, organisationBId, async (tx) => {
      await tx.execute(sql`
        INSERT INTO organisations (id, public_id, type, name, settings)
        VALUES (${organisationBId}, ${publicId()}, 'individual', ${`Answer Organisation B [${RUN_ID}]`}, '{}')
      `);
    });

    const [flow] = await db
      .insert(assessmentFlows)
      .values({ name: `Answer flow [${RUN_ID}]` })
      .returning({ id: assessmentFlows.id });
    flowId = flow.id;

    const inserted = await db
      .insert(questions)
      .values(
        [1, 2].map((index) => ({
          slug: `answer-question-${RUN_ID}-${randomUUID().slice(0, 8)}-${String(index)}`,
          type: 'text' as const,
          questionText: `Answer question ${String(index)}`,
        }))
      )
      .returning({ id: questions.id });
    questionIds = inserted.map((question) => question.id);
  });

  afterEach(async () => {
    // The organisations take their assessments and answers with them (ON DELETE CASCADE);
    // the questions (RESTRICT from answers) and the flow go after
    await deleteOrganisations(db, [organisationAId, organisationBId]);
    await db.delete(questions).where(inArray(questions.id, questionIds));
    await db.delete(assessmentFlows).where(inArray(assessmentFlows.id, [flowId]));
  });

  afterAll(async () => {
    await pool.end();
  });

  const createAssessment = async (): Promise<string> => {
    const assessment = await userAssessmentRepository.createUserAssessment({
      organisationId: organisationAId,
      userId: userAId,
      flowId,
    });

    return assessment.id;
  };

  /** Organisation A's stored answers for one assessment, read under A's own context. */
  const storedAnswers = async (
    assessmentId: string
  ): Promise<(typeof userAssessmentAnswers.$inferSelect)[]> =>
    await asOrganisation(db, organisationAId, (tx) =>
      tx
        .select()
        .from(userAssessmentAnswers)
        .where(eq(userAssessmentAnswers.userAssessmentId, assessmentId))
        .orderBy(asc(userAssessmentAnswers.questionId))
    );

  const sortedIds = (ids: string[]): string[] => [...ids].sort();

  describe('saveAnswers', () => {
    it('updates the stored answer when a question is answered again, keeping one row', async () => {
      const assessmentId = await createAssessment();
      const [questionId] = questionIds;

      await answerRepository.saveAnswers(organisationAId, assessmentId, [
        { questionId, answerValue: 'first' },
      ]);
      const [first] = await storedAnswers(assessmentId);
      // answeredAt has millisecond precision: make sure the second save is a later instant
      await new Promise((resolve) => setTimeout(resolve, 5));

      await answerRepository.saveAnswers(organisationAId, assessmentId, [
        { questionId, answerValue: 'second' },
      ]);

      const stored = await storedAnswers(assessmentId);
      expect(stored).toEqual([
        {
          ...first,
          answerValue: 'second',
          answeredAt: expect.any(Date) as unknown,
        },
      ]);
      expect(stored[0].answeredAt.getTime()).toBeGreaterThan(first.answeredAt.getTime());
    });

    it('adds a row for each different question', async () => {
      const assessmentId = await createAssessment();

      await answerRepository.saveAnswers(organisationAId, assessmentId, [
        { questionId: questionIds[0], answerValue: 'one' },
      ]);
      await answerRepository.saveAnswers(organisationAId, assessmentId, [
        { questionId: questionIds[1], answerValue: 'two' },
      ]);

      const stored = await storedAnswers(assessmentId);
      expect(stored.map((answer) => answer.questionId)).toEqual(sortedIds(questionIds));
    });
  });

  describe('deleteByQuestionIds', () => {
    it('deletes only the listed questions of that assessment', async () => {
      const assessmentId = await createAssessment();
      const otherAssessmentId = await createAssessment();
      const [listed, kept] = questionIds;

      await answerRepository.saveAnswers(organisationAId, assessmentId, [
        { questionId: listed, answerValue: 'listed' },
        { questionId: kept, answerValue: 'kept' },
      ]);
      await answerRepository.saveAnswers(organisationAId, otherAssessmentId, [
        { questionId: listed, answerValue: 'same question, other assessment' },
      ]);

      await answerRepository.deleteByQuestionIds(organisationAId, assessmentId, [listed]);

      expect((await storedAnswers(assessmentId)).map((answer) => answer.questionId)).toEqual([
        kept,
      ]);
      expect((await storedAnswers(otherAssessmentId)).map((answer) => answer.answerValue)).toEqual([
        'same question, other assessment',
      ]);
    });

    it('deletes nothing for an empty list', async () => {
      const assessmentId = await createAssessment();

      await answerRepository.saveAnswers(organisationAId, assessmentId, [
        { questionId: questionIds[0], answerValue: 'one' },
        { questionId: questionIds[1], answerValue: 'two' },
      ]);

      await answerRepository.deleteByQuestionIds(organisationAId, assessmentId, []);

      expect(await storedAnswers(assessmentId)).toHaveLength(2);
    });
  });

  describe('under another organisation', () => {
    it('cannot delete organisation A’s answers', async () => {
      const assessmentId = await createAssessment();

      await answerRepository.saveAnswers(organisationAId, assessmentId, [
        { questionId: questionIds[0], answerValue: 'mine' },
      ]);

      await answerRepository.deleteByQuestionIds(organisationBId, assessmentId, [questionIds[0]]);

      expect((await storedAnswers(assessmentId)).map((answer) => answer.answerValue)).toEqual([
        'mine',
      ]);
    });

    it('cannot overwrite an answer organisation A has stored', async () => {
      const assessmentId = await createAssessment();

      await answerRepository.saveAnswers(organisationAId, assessmentId, [
        { questionId: questionIds[0], answerValue: 'mine' },
      ]);

      // The conflicting row is invisible to B, so the upsert's update is refused by RLS
      await expect(
        answerRepository.saveAnswers(organisationBId, assessmentId, [
          { questionId: questionIds[0], answerValue: 'overwritten' },
        ])
      ).rejects.toMatchObject({ cause: { code: '42501' } });

      expect((await storedAnswers(assessmentId)).map((answer) => answer.answerValue)).toEqual([
        'mine',
      ]);
    });

    // Suspected defect: the row is stored with B's organisation id against A's assessment.
    // The policy checks only the row's own organisation_id, and the foreign key is checked
    // without RLS, so nothing ties an answer's organisation to its assessment's. Fails today
    // (the insert succeeds); either fix turns this red (a policy check refuses with 42501, a
    // composite foreign key with 23503), prompting the flip to `it`
    it.fails('cannot add an answer to organisation A’s assessment', async () => {
      const assessmentId = await createAssessment();

      await expect(
        answerRepository.saveAnswers(organisationBId, assessmentId, [
          { questionId: questionIds[1], answerValue: 'added by another organisation' },
        ])
      ).rejects.toMatchObject({
        cause: { code: expect.stringMatching(/^(42501|23503)$/) as unknown },
      });
    });

    it('adds an answer to organisation A’s assessment that A cannot see, which then blocks A from answering that question', async () => {
      const assessmentId = await createAssessment();
      const [questionId] = questionIds;

      const [added] = await answerRepository.saveAnswers(organisationBId, assessmentId, [
        { questionId, answerValue: 'added by another organisation' },
      ]);

      expect(added).toMatchObject({
        organisationId: organisationBId,
        userAssessmentId: assessmentId,
      });
      expect(await storedAnswers(assessmentId)).toEqual([]);
      await expect(
        answerRepository.saveAnswers(organisationAId, assessmentId, [
          { questionId, answerValue: 'mine' },
        ])
      ).rejects.toMatchObject({ cause: { code: '42501' } });
    });
  });
});
