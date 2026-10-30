import { eq } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { type Pool } from 'pg';

import { createLogger } from '../src/lib/logger.js';
import { userAssessmentAnswers, userAssessments } from '../src/schema/index.js';

import { requireSeedId } from './requireSeedId.js';
import { FLOW_IDS } from './seedAssessmentFlows.js';
import { STEP_IDS } from './seedFlowSteps.js';
import { PROGRAMME_IDS, TEST_ORGANISATION_ID, TEST_USER_ID } from './seedProgrammeUserData.js';
import { QUESTION_IDS, type QuestionSlug } from './seedQuestions.js';

import type * as schema from '../src/schema/index.js';
import type { NewUserAssessmentAnswer } from '../src/schema/user-assessment-answers.js';
import type { NewUserAssessment } from '../src/schema/user-assessments.js';
import type { AnswerValue } from '../src/types/index.js';

const logger = createLogger('seed-programme-user-assessment');

/** Deterministic UUIDs: AAAAAAAA-AAAA-AAAA-8AAA-AAAAAAAAA0XX, continuing the programme user data */
export const USER_ASSESSMENT_IDS = {
  'test-user-wellness': 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa31',
} as const;

const COMPLETED_AT = new Date('2026-03-24T18:07:00Z');

/**
 * The completed Wellness check-in that produced the test user's programme. Scoring's result
 * is not stored: `scores` stays null, and the linked programme marks it ready.
 */
export const PROGRAMME_USER_ASSESSMENT: NewUserAssessment = {
  id: USER_ASSESSMENT_IDS['test-user-wellness'],
  organisationId: TEST_ORGANISATION_ID,
  userId: TEST_USER_ID,
  flowId: FLOW_IDS.WELLNESS,
  status: 'completed',
  currentStep: 5,
  visitedStepIds: [
    STEP_IDS.WELLNESS_INTRO,
    STEP_IDS.WELLNESS_ABOUT_YOU,
    STEP_IDS.WELLNESS_GOALS_AND_SAFETY,
    STEP_IDS.WELLNESS_RESULTS,
    STEP_IDS.WELLNESS_PROGRAMME_OVERVIEW,
  ],
  warningsShown: [],
  programmeId: PROGRAMME_IDS['test-user-active'],
  startedAt: new Date('2026-03-24T18:00:00Z'),
  submittedAt: new Date('2026-03-24T18:06:00Z'),
  completedAt: COMPLETED_AT,
};

/**
 * One answer per question the Wellness flow asks, matching the level 1 programme: a less active
 * member over 40, after relief from stiffness in the neck, shoulders and lower back.
 */
const ANSWERS: [QuestionSlug, string, AnswerValue][] = [
  ['gender', 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa41', 'female'],
  ['age-bracket', 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa42', '46-55'],
  ['weekly-activity', 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa43', 'low'],
  ['exercise-tolerance', 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa44', 'low'],
  ['joint-comfort', 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa45', 'stiff'],
  ['session-goal', 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa46', 'relieve-tension'],
  ['focus-areas', 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa47', ['neck-shoulders', 'lower-back-core']],
  ['safety-check', 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaa48', ['none']],
];

export const PROGRAMME_USER_ASSESSMENT_ANSWERS: NewUserAssessmentAnswer[] = ANSWERS.map(
  ([slug, id, answerValue]) => ({
    id,
    organisationId: TEST_ORGANISATION_ID,
    userAssessmentId: USER_ASSESSMENT_IDS['test-user-wellness'],
    questionId: QUESTION_IDS[slug],
    answerValue,
    answeredAt: COMPLETED_AT,
  })
);

/**
 * Seeds the assessment linked to the test user's programme, with its answers, so the admin's
 * view of the programme shows the answers that shaped it.
 * IDEMPOTENT — checks the assessment by ID; answers skip on the one-per-question constraint.
 * Must run AFTER: seedProgrammeUserData, seedAssessmentFlows, seedFlowSteps, seedQuestions
 */
export const seedProgrammeUserAssessment = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<void> => {
  logger.info('Seeding test user assessment...');

  const existing = await db.query.userAssessments.findFirst({
    where: eq(userAssessments.id, requireSeedId(PROGRAMME_USER_ASSESSMENT, 'test user assessment')),
  });

  if (existing) {
    logger.warn('Test user assessment already exists, skipping');
  } else {
    await db.insert(userAssessments).values(PROGRAMME_USER_ASSESSMENT);
  }

  const inserted = await db
    .insert(userAssessmentAnswers)
    .values(PROGRAMME_USER_ASSESSMENT_ANSWERS)
    .onConflictDoNothing({
      target: [userAssessmentAnswers.userAssessmentId, userAssessmentAnswers.questionId],
    })
    .returning({ id: userAssessmentAnswers.id });

  logger.info('Test user assessment seed complete', {
    assessmentCreated: !existing,
    answersCreated: inserted.length,
    answersAlreadyExisted: PROGRAMME_USER_ASSESSMENT_ANSWERS.length - inserted.length,
  });
};
