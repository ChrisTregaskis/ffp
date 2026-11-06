import { eq } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';

import { AGE_BRACKET_OPTIONS, LEVEL_QUESTION_IDS } from '../constants/level-scoring.constants.js';
import { createLogger } from '../lib/logger.js';
import { questions } from '../schema/index.js';

import { requireSeedId } from './requireSeedId.js';

import type * as schema from '../schema/index.js';
import type { NewQuestion } from '../schema/questions.js';

const logger = createLogger('seed-questions');

/**
 * Deterministic UUIDs for questions
 *
 * These are fixed to ensure consistency across seed runs and allow
 * template_questions and scoring configs to reference them reliably.
 *
 * UUID Pattern: 22222222-2222-2222-8222-2222222207XX (the level questions come from
 * LEVEL_QUESTION_IDS). The branching demo's questions use 01xx–03xx.
 */
export const QUESTION_IDS = {
  // Wellness assessment
  gender: '22222222-2222-2222-8222-222222220701',
  'age-bracket': LEVEL_QUESTION_IDS.ageBracket,
  'weekly-activity': LEVEL_QUESTION_IDS.weeklyActivity,
  'exercise-tolerance': LEVEL_QUESTION_IDS.exerciseTolerance,
  'joint-comfort': LEVEL_QUESTION_IDS.jointComfort,
  'session-goal': '22222222-2222-2222-8222-222222220706',
  'focus-areas': '22222222-2222-2222-8222-222222220707',
  'safety-check': '22222222-2222-2222-8222-222222220708',
} as const;

export type QuestionSlug = keyof typeof QUESTION_IDS;

/** Wellness assessment: "About you" */
const aboutYouQuestions: NewQuestion[] = [
  {
    id: QUESTION_IDS.gender,
    slug: 'gender',
    type: 'single-choice',
    questionText: 'Which best describes your gender?',
    options: [
      { value: 'female', label: 'Female' },
      { value: 'male', label: 'Male' },
      { value: 'prefer-not-to-say', label: 'Prefer not to say' },
    ],
    validation: { required: true },
    scoreDimension: null,
    isActive: true,
  },
  {
    id: QUESTION_IDS['age-bracket'],
    slug: 'age-bracket',
    type: 'single-choice',
    questionText: 'Which age bracket are you in?',
    options: AGE_BRACKET_OPTIONS,
    validation: { required: true },
    scoreDimension: 'age',
    isActive: true,
  },
  {
    id: QUESTION_IDS['weekly-activity'],
    slug: 'weekly-activity',
    type: 'single-choice',
    questionText: 'How would you describe your typical weekly physical activity?',
    options: [
      {
        value: 'low',
        label: 'Low: I mostly sit during the day and mainly walk for exercise.',
        score: 1,
      },
      {
        value: 'moderate',
        label:
          'Moderate: I do light cycling, yoga/pilates, or occasional workouts (1–2 times a week).',
        score: 2,
      },
      {
        value: 'active',
        label:
          'Active: I exercise regularly (3+ times a week) or play intense sport regularly, like football or rugby.',
        score: 3,
      },
    ],
    validation: { required: true },
    scoreDimension: 'activity',
    isActive: true,
  },
  {
    id: QUESTION_IDS['exercise-tolerance'],
    slug: 'exercise-tolerance',
    type: 'single-choice',
    questionText: 'How would you describe your exercise tolerance?',
    options: [
      {
        value: 'low',
        label: 'Low: I can do light exercise like walks, but not much more intense than that.',
        score: 1,
      },
      {
        value: 'moderate',
        label: 'Moderate: I could manage jogging, pilates or light gym sessions.',
        score: 2,
      },
      {
        value: 'high',
        label: 'High: I can go on runs, play sport, do gym sessions and manage a high heart rate.',
        score: 3,
      },
    ],
    validation: { required: true },
    scoreDimension: 'activity',
    isActive: true,
  },
  {
    id: QUESTION_IDS['joint-comfort'],
    slug: 'joint-comfort',
    type: 'single-choice',
    questionText: 'How do your joints and muscles generally feel when you move or stretch?',
    options: [
      {
        value: 'stiff',
        label: 'I frequently feel stiff, tight, or have mild, nagging aches that make me cautious.',
        score: 1,
      },
      {
        value: 'occasionally-stiff',
        label: 'I get occasional stiffness after a long day at the desk, but I move fairly easily.',
        score: 2,
      },
      {
        value: 'flexible',
        label: 'I feel flexible, strong, and comfortable doing a wide range of movements.',
        score: 3,
      },
    ],
    validation: { required: true },
    scoreDimension: 'activity',
    isActive: true,
  },
];

/** Wellness assessment: "Goals and safety" */
const goalsAndSafetyQuestions: NewQuestion[] = [
  {
    id: QUESTION_IDS['session-goal'],
    slug: 'session-goal',
    type: 'single-choice',
    questionText: "What is your main goal for today's session?",
    options: [
      {
        value: 'relieve-tension',
        label: 'Relieve tension & stiffness (great for long desk sessions)',
      },
      {
        value: 'build-strength',
        label: 'Build strength & stability (great for physical resilience)',
      },
      { value: 'boost-energy', label: 'Boost energy & get moving (great for a midday refresh)' },
    ],
    validation: { required: true },
    scoreDimension: null,
    isActive: true,
  },
  {
    id: QUESTION_IDS['focus-areas'],
    slug: 'focus-areas',
    type: 'multi-choice',
    questionText: 'Which areas of the body would you like to focus on?',
    description: 'Select up to 2',
    options: [
      { value: 'neck-shoulders', label: 'Neck & Shoulders (ideal for easing typing tightness)' },
      {
        value: 'lower-back-core',
        label: 'Lower Back & Core (great for supporting sitting posture)',
      },
      {
        value: 'hips-lower-body',
        label: 'Hips & Lower Body (perfect for opening up tight glutes and hip flexors)',
      },
      { value: 'full-body', label: 'Full Body Refresh (a balanced mix of everything)' },
    ],
    validation: { required: true, maxSelections: 2 },
    scoreDimension: null,
    isActive: true,
  },
  {
    id: QUESTION_IDS['safety-check'],
    slug: 'safety-check',
    type: 'multi-choice',
    questionText:
      'To make sure we keep things safe and tailored to you, have you recently experienced any of the following?',
    description: 'Select all that apply',
    options: [
      {
        value: 'chest-pain',
        label: 'Sudden chest pain or shortness of breath during mild activity',
      },
      { value: 'dizziness', label: 'Unexplained dizziness, fainting, or loss of balance' },
      {
        value: 'night-pain',
        label: 'Severe, unrelenting pain during the night that prevents you from sleeping',
      },
      { value: 'none', label: 'None of the above' },
    ],
    validation: { required: true },
    scoreDimension: null,
    isActive: true,
  },
];

/** The wellness questions every environment carries */
export const DEFAULT_QUESTIONS: NewQuestion[] = [...aboutYouQuestions, ...goalsAndSafetyQuestions];

/**
 * Seeds the given questions. IDEMPOTENT: a question that already exists, matched by ID, is left
 * as it is. The questions table has no RLS.
 */
export const seedQuestions = async (
  db: NodePgDatabase<typeof schema>,
  records: NewQuestion[]
): Promise<number> => {
  logger.info('Seeding questions...');

  let createdCount = 0;

  for (const question of records) {
    const existingQuestion = await db.query.questions.findFirst({
      where: eq(questions.id, requireSeedId(question, `question "${question.slug}"`)),
    });

    if (existingQuestion) {
      logger.warn(`Question already exists: "${question.slug}"`);
      continue;
    }

    const [newQuestion] = await db.insert(questions).values(question).returning({
      id: questions.id,
      slug: questions.slug,
      type: questions.type,
    });

    logger.info('Question created', {
      slug: newQuestion.slug,
      id: newQuestion.id,
      type: newQuestion.type,
    });

    createdCount++;
  }

  logger.info('Questions seed complete', {
    created: createdCount,
    alreadyExisted: records.length - createdCount,
  });

  return createdCount;
};
