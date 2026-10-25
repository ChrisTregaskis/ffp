import { randomUUID } from 'crypto';

import { eq, inArray, sql } from 'drizzle-orm';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

import type { ScoringConfig } from '@ffp/database';
import {
  assessmentFlows,
  assessmentTemplates,
  flowSteps,
  processJobs,
  questions,
  templateQuestions,
  userAssessments,
} from '@ffp/database/schema';

import * as answerRepository from '../../src/assessments/answer.repository';
import * as userAssessmentRepository from '../../src/assessments/user-assessment.repository';
import { processScoreAssessment } from '../../src/jobs/handlers/score-assessment.handler';
import * as jobQueueService from '../../src/jobs/job-queue.service';
import { asOrganisation, deleteOrganisations } from '../lib/rls-context.fixture';
import { connectTestDb, type TestDb } from '../lib/test-db.fixture';

import type { Pool } from 'pg';

type JobQueueModule = typeof jobQueueService;

// Pass-through, so a test can make queueing fail after the job row is written
vi.mock('../../src/jobs/job-queue.service', async (importOriginal) => {
  const actual = await importOriginal<JobQueueModule>();

  return { ...actual, queueJob: vi.fn(actual.queueJob) };
});

// Catalogue rows are shared: every slug and name carries a per-run marker, and clean-up
// deletes only the ids recorded here
const RUN_ID = randomUUID().slice(0, 8);

const publicId = (): string => randomUUID().replace(/-/g, '').slice(0, 12);

describe('processScoreAssessment', () => {
  let pool: Pool;
  let db: TestDb;

  let organisationId: string;
  let userId: string;
  let flowId: string;
  let templateId: string;
  let questionIds: string[];
  let recommendedSlug: string;

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  beforeEach(async () => {
    // Reset, so a once-implementation left by a failed test cannot leak into the next
    vi.mocked(jobQueueService.queueJob).mockReset();
    organisationId = randomUUID();
    userId = randomUUID();
    recommendedSlug = `steady-strength-${RUN_ID}`;

    await asOrganisation(db, organisationId, async (tx) => {
      await tx.execute(sql`
        INSERT INTO organisations (id, public_id, type, name, settings)
        VALUES (${organisationId}, ${publicId()}, 'individual', ${`Scoring Organisation [${RUN_ID}]`}, '{}')
      `);
      await tx.execute(sql`
        INSERT INTO users (id, public_id, organisation_id, location_id, email, cognito_sub, first_name, last_name, role)
        VALUES (${userId}, ${publicId()}, ${organisationId}, NULL, ${`scoring-${userId.slice(0, 8)}@test.com`}, ${`cognito-${userId.slice(0, 8)}`}, 'Sam', 'Score', 'programme_user')
      `);
    });

    const inserted = await db
      .insert(questions)
      .values([
        {
          slug: `scoring-lift-${RUN_ID}-${randomUUID().slice(0, 8)}`,
          type: 'single-choice' as const,
          questionText: 'How often do you lift something heavy?',
          options: [
            { value: 'rarely', label: 'Rarely', score: 1 },
            { value: 'often', label: 'Often', score: 4 },
          ],
        },
        {
          slug: `scoring-stairs-${RUN_ID}-${randomUUID().slice(0, 8)}`,
          type: 'single-choice' as const,
          questionText: 'How do stairs feel?',
          options: [
            { value: 'hard', label: 'Hard', score: 0 },
            { value: 'easy', label: 'Easy', score: 3 },
          ],
        },
      ])
      .returning({ id: questions.id });
    questionIds = inserted.map((question) => question.id);

    const [template] = await db
      .insert(assessmentTemplates)
      .values({ name: `Scoring template [${RUN_ID}]` })
      .returning({ id: assessmentTemplates.id });
    templateId = template.id;
    await db.insert(templateQuestions).values(
      questionIds.map((questionId, index) => ({
        templateId,
        questionId,
        displayOrder: index + 1,
      }))
    );

    const scoringConfig: ScoringConfig = {
      dimensions: [{ name: 'strength', questionIds, maxScore: 10 }],
      programmeMappings: [
        {
          // Mapping conditions compare the raw score
          conditions: [{ dimension: 'strength', operator: 'gte', value: 5 }],
          programmeTemplateId: recommendedSlug,
        },
      ],
    };
    const [flow] = await db
      .insert(assessmentFlows)
      .values({ name: `Scoring flow [${RUN_ID}]`, scoringConfig })
      .returning({ id: assessmentFlows.id });
    flowId = flow.id;
    await db.insert(flowSteps).values({
      flowId,
      order: 1,
      type: 'questions',
      templateId,
      config: { title: 'Strength' },
    });
  });

  afterEach(async () => {
    // The organisation takes its assessments, answers and jobs with it (ON DELETE CASCADE);
    // then the catalogue rows in foreign-key order
    await deleteOrganisations(db, [organisationId]);
    await db.delete(flowSteps).where(eq(flowSteps.flowId, flowId));
    await db.delete(assessmentFlows).where(eq(assessmentFlows.id, flowId));
    await db.delete(templateQuestions).where(eq(templateQuestions.templateId, templateId));
    await db.delete(assessmentTemplates).where(eq(assessmentTemplates.id, templateId));
    await db.delete(questions).where(inArray(questions.id, questionIds));
  });

  afterAll(async () => {
    await pool.end();
  });

  /** A submitted assessment answered "often" (4) and "easy" (3): strength 7 of 10. */
  const createSubmittedAssessment = async (
    { answered }: { answered: boolean } = { answered: true }
  ): Promise<string> => {
    const assessment = await userAssessmentRepository.createUserAssessment({
      organisationId,
      userId,
      flowId,
    });

    if (answered) {
      await answerRepository.saveAnswers(organisationId, assessment.id, [
        { questionId: questionIds[0], answerValue: 'often' },
        { questionId: questionIds[1], answerValue: 'easy' },
      ]);
    }

    await userAssessmentRepository.transitionAssessmentStatus(
      organisationId,
      assessment.id,
      'in_progress'
    );
    await userAssessmentRepository.transitionAssessmentStatus(
      organisationId,
      assessment.id,
      'submitted'
    );

    return assessment.id;
  };

  const storedAssessment = async (
    assessmentId: string
  ): Promise<typeof userAssessments.$inferSelect> => {
    const rows = await asOrganisation(db, organisationId, (tx) =>
      tx.select().from(userAssessments).where(eq(userAssessments.id, assessmentId))
    );

    expect(rows).toHaveLength(1);

    return rows[0];
  };

  /** Jobs queued for this test's organisation only (process_jobs is not RLS-scoped). */
  const queuedJobs = async (): Promise<(typeof processJobs.$inferSelect)[]> =>
    await db.select().from(processJobs).where(eq(processJobs.organisationId, organisationId));

  const strength = {
    dimensionId: 'strength',
    dimensionName: 'Strength',
    rawScore: 7,
    normalisedScore: 70,
    category: 'low',
    answeredCount: 2,
  };

  it('stores the scores and moves the assessment to scored', async () => {
    const assessmentId = await createSubmittedAssessment();

    const result = await processScoreAssessment(
      { userAssessmentId: assessmentId, flowId, userId },
      organisationId
    );

    expect(result).toMatchObject({ scores: [strength], overallScore: 70 });
    const stored = await storedAssessment(assessmentId);
    expect(stored.status).toBe('scored');
    expect(stored.scores).toEqual({
      dimensions: [strength],
      overallScore: 70,
      riskLevel: 'low',
      recommendedTemplateSlug: recommendedSlug,
      scoredAt: expect.any(String) as unknown,
    });
  });

  it('queues one high-priority generate_programme job carrying the scores and the recommended template', async () => {
    const assessmentId = await createSubmittedAssessment();

    await processScoreAssessment(
      { userAssessmentId: assessmentId, flowId, userId },
      organisationId
    );

    const jobs = await queuedJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      type: 'generate_programme',
      status: 'queued',
      priority: 2,
      payload: {
        assessmentSubmissionId: assessmentId,
        userId,
        scores: [strength],
        recommendedTemplateSlug: recommendedSlug,
      },
    });
  });

  it('writes the scores and the job in one transaction: a failure after queueing keeps neither', async () => {
    const assessmentId = await createSubmittedAssessment();
    const { queueJob: realQueueJob } = await vi.importActual<JobQueueModule>(
      '../../src/jobs/job-queue.service'
    );
    vi.mocked(jobQueueService.queueJob).mockImplementationOnce(
      async (type, payload, context, options) => {
        await realQueueJob(type, payload, context, options);
        throw new Error('Failed after queueing');
      }
    );

    await expect(
      processScoreAssessment({ userAssessmentId: assessmentId, flowId, userId }, organisationId)
    ).rejects.toThrow('Failed after queueing');

    expect(await storedAssessment(assessmentId)).toMatchObject({
      status: 'submitted',
      scores: null,
    });
    expect(await queuedJobs()).toEqual([]);
  });

  it('refuses an assessment with no answers, leaving it unchanged and queueing nothing', async () => {
    const assessmentId = await createSubmittedAssessment({ answered: false });

    await expect(
      processScoreAssessment({ userAssessmentId: assessmentId, flowId, userId }, organisationId)
    ).rejects.toMatchObject({
      name: 'ValidationError',
      message: `No answers found for assessment ${assessmentId}. Cannot score.`,
    });

    expect(await storedAssessment(assessmentId)).toMatchObject({
      status: 'submitted',
      scores: null,
    });
    expect(await queuedJobs()).toEqual([]);
  });

  /** Runs the handler with its log lines captured; returns the warnings it logged. */
  const scoreCapturingWarnings = async (
    assessmentId: string
  ): Promise<{ result: unknown; warnings: unknown[]; logged: string }> => {
    vi.stubEnv('LOG_LEVEL', undefined);
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      const result = await processScoreAssessment(
        { userAssessmentId: assessmentId, flowId, userId },
        organisationId
      );
      const entries = consoleLog.mock.calls.map(
        ([line]) => JSON.parse(line as string) as { level: string; message: string }
      );

      return {
        result,
        warnings: entries.filter((entry) => entry.level === 'WARN'),
        logged: JSON.stringify(consoleLog.mock.calls),
      };
    } finally {
      consoleLog.mockRestore();
      vi.unstubAllEnvs();
    }
  };

  const skippedWarning = (assessmentId: string, status: string): unknown => ({
    level: 'WARN',
    message: 'Scoring skipped: the assessment is not awaiting scoring',
    service: 'score-assessment-handler',
    timestamp: expect.any(String) as unknown,
    context: { assessmentId, status },
  });

  describe('an assessment that has already completed', () => {
    it('is left completed, and no programme job is queued', async () => {
      const assessmentId = await createSubmittedAssessment();

      await userAssessmentRepository.transitionAssessmentStatus(
        organisationId,
        assessmentId,
        'scored'
      );
      await userAssessmentRepository.transitionAssessmentStatus(
        organisationId,
        assessmentId,
        'completed'
      );

      const { result, warnings, logged } = await scoreCapturingWarnings(assessmentId);

      // Returned normally, so the job processor marks the job done rather than retrying it
      expect(result).toMatchObject({ scores: [strength], overallScore: 70 });
      expect(await storedAssessment(assessmentId)).toMatchObject({
        status: 'completed',
        scores: null,
      });
      expect(await queuedJobs()).toEqual([]);
      expect(warnings).toEqual([skippedWarning(assessmentId, 'completed')]);
      // Answers stay out of the logs
      expect(logged).not.toContain('often');
    });
  });

  describe('an assessment already scored, by a repeated job', () => {
    it('is left as it was, and no second programme job is queued', async () => {
      const assessmentId = await createSubmittedAssessment();

      await processScoreAssessment(
        { userAssessmentId: assessmentId, flowId, userId },
        organisationId
      );
      const scoredOnce = await storedAssessment(assessmentId);

      const { warnings } = await scoreCapturingWarnings(assessmentId);

      expect(await storedAssessment(assessmentId)).toEqual(scoredOnce);
      expect((await queuedJobs()).map((job) => job.type)).toEqual(['generate_programme']);
      expect(warnings).toEqual([skippedWarning(assessmentId, 'scored')]);
    });
  });

  describe('an assessment still in progress', () => {
    it('is left unscored, and no programme job is queued', async () => {
      const assessment = await userAssessmentRepository.createUserAssessment({
        organisationId,
        userId,
        flowId,
      });
      await answerRepository.saveAnswers(organisationId, assessment.id, [
        { questionId: questionIds[0], answerValue: 'often' },
        { questionId: questionIds[1], answerValue: 'easy' },
      ]);
      await userAssessmentRepository.transitionAssessmentStatus(
        organisationId,
        assessment.id,
        'in_progress'
      );

      const { warnings } = await scoreCapturingWarnings(assessment.id);

      expect(await storedAssessment(assessment.id)).toMatchObject({
        status: 'in_progress',
        scores: null,
      });
      expect(await queuedJobs()).toEqual([]);
      expect(warnings).toEqual([skippedWarning(assessment.id, 'in_progress')]);
    });
  });
});
