import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { questions } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import {
  AGE_BRACKET_OPTIONS,
  LEVEL_QUESTION_IDS,
} from '../src/constants/level-scoring.constants.js';

import type { NewQuestion } from '../src/schema/questions.js';

const logger = createLogger('seed-questions');

/**
 * Deterministic UUIDs for demo videos
 *
 * These are placeholder UUIDs for videos referenced by questions.
 * When actual videos are seeded, they should use these IDs.
 *
 * UUID Pattern: 33333333-3333-3333-8333-3333333300XX
 */
export const VIDEO_IDS = {
  'wall-squat-demo': '33333333-3333-3333-8333-333333330001',
  'modified-pushup-demo': '33333333-3333-3333-8333-333333330002',
  'single-leg-stand-demo': '33333333-3333-3333-8333-333333330003',
  'tandem-stand-demo': '33333333-3333-3333-8333-333333330004',
} as const;

export type VideoSlug = keyof typeof VIDEO_IDS;

/**
 * Deterministic UUIDs for questions
 *
 * These are fixed to ensure consistency across seed runs and allow
 * template_questions and scoring configs to reference them reliably.
 *
 * UUID Pattern: 22222222-2222-2222-8222-2222222200XX
 * - Branching demo, getting started: 01xx
 * - Branching demo, strength check: 02xx
 * - Branching demo, balance check: 03xx
 * - Wellness assessment: 07xx (the level questions come from LEVEL_QUESTION_IDS)
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

  // Branching demo
  'activity-level': '22222222-2222-2222-8222-222222220104',
  'check-focus': '22222222-2222-2222-8222-222222220107',
  'squat-assessment': '22222222-2222-2222-8222-222222220201',
  'squat-rating': '22222222-2222-2222-8222-222222220202',
  'single-leg-stand': '22222222-2222-2222-8222-222222220301',
  'single-leg-duration': '22222222-2222-2222-8222-222222220302',
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

/** Branching demo: "Getting started" */
const gettingStartedQuestions: NewQuestion[] = [
  {
    id: QUESTION_IDS['activity-level'],
    slug: 'activity-level',
    type: 'single-choice',
    questionText: 'How would you describe your current activity level?',
    options: [
      { value: 'sedentary', label: 'Sedentary (little to no exercise)' },
      { value: 'light', label: 'Lightly active (light exercise 1-3 days/week)' },
      { value: 'moderate', label: 'Moderately active (moderate exercise 3-5 days/week)' },
      { value: 'very-active', label: 'Very active (hard exercise 6-7 days/week)' },
    ],
    validation: { required: true },
    scoreDimension: null,
    isActive: true,
  },
  {
    id: QUESTION_IDS['check-focus'],
    slug: 'check-focus',
    type: 'single-choice',
    questionText: 'Which movement check would you like to start with?',
    description: 'Choosing balance skips the strength check.',
    options: [
      { value: 'strength', label: 'Strength, then balance' },
      { value: 'balance', label: 'Balance only' },
    ],
    validation: { required: true },
    scoreDimension: null,
    isActive: true,
  },
];

/** Branching demo: "Strength check" */
const strengthCheckQuestions: NewQuestion[] = [
  {
    id: QUESTION_IDS['squat-assessment'],
    slug: 'squat-assessment',
    type: 'video-response',
    questionText: 'Wall Squat Hold',
    description: 'Hold a wall squat position for as long as comfortable',
    videoId: VIDEO_IDS['wall-squat-demo'],
    validation: { required: true, min: 0, max: 300 },
    scoreDimension: 'strength',
    isActive: true,
  },
  {
    id: QUESTION_IDS['squat-rating'],
    slug: 'squat-rating',
    type: 'single-choice',
    questionText: 'How did you find the wall squat?',
    options: [
      { value: 'very-difficult', label: 'Very difficult - could not complete', score: 1 },
      { value: 'difficult', label: 'Difficult - held for less than 15 seconds', score: 2 },
      { value: 'moderate', label: 'Moderate - held for 15-30 seconds', score: 3 },
      { value: 'easy', label: 'Easy - held for over 30 seconds', score: 4 },
    ],
    validation: { required: true },
    scoreDimension: 'strength',
    isActive: true,
  },
];

/** Branching demo: "Balance check" */
const balanceCheckQuestions: NewQuestion[] = [
  {
    id: QUESTION_IDS['single-leg-stand'],
    slug: 'single-leg-stand',
    type: 'video-response',
    questionText: 'Single Leg Stand',
    description: 'Stand on one leg for as long as you can safely manage',
    videoId: VIDEO_IDS['single-leg-stand-demo'],
    validation: { required: true, min: 0, max: 300 },
    scoreDimension: 'balance',
    isActive: true,
  },
  {
    id: QUESTION_IDS['single-leg-duration'],
    slug: 'single-leg-duration',
    type: 'single-choice',
    questionText: 'How long could you hold the single leg stand?',
    options: [
      { value: 'less-5', label: 'Less than 5 seconds', score: 1 },
      { value: '5-15', label: '5-15 seconds', score: 2 },
      { value: '15-30', label: '15-30 seconds', score: 3 },
      { value: 'over-30', label: 'Over 30 seconds', score: 4 },
    ],
    validation: { required: true },
    scoreDimension: 'balance',
    isActive: true,
  },
];

/**
 * All default questions to seed
 */
const DEFAULT_QUESTIONS: NewQuestion[] = [
  ...aboutYouQuestions,
  ...goalsAndSafetyQuestions,
  ...gettingStartedQuestions,
  ...strengthCheckQuestions,
  ...balanceCheckQuestions,
];

/**
 * Seeds questions for MVP.
 *
 * This seed is IDEMPOTENT - safe to run multiple times.
 * Questions are upserted by ID (existing questions are skipped).
 *
 * Note: questions table has NO RLS, so no special context needed.
 *
 * @param db - Database client with schema
 * @returns Promise<number> - Number of questions created (0 if all existed)
 */
export const seedQuestions = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<number> => {
  logger.info('Seeding questions...');

  let createdCount = 0;

  for (const question of DEFAULT_QUESTIONS) {
    // Check if question already exists (idempotency check by ID)
    const existingQuestion = await db.query.questions.findFirst({
      where: eq(questions.id, question.id!),
    });

    if (existingQuestion) {
      logger.warn(`Question already exists: "${question.slug}"`);
      continue;
    }

    // Insert new question
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
    alreadyExisted: DEFAULT_QUESTIONS.length - createdCount,
  });

  return createdCount;
};
